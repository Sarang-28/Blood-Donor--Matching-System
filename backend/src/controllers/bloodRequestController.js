const { fail, safeDonor } = require('../utils/security');
const db = require('../config/db');
const donorMatchingService = require('../services/donorMatchingService');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');
const { REQUEST_STATUS, URGENCY_LEVEL } = require('../constants/statuses');

/**
 * Create a new blood request and immediately match nearby eligible donors
 */
const createRequest = async (req, res, next) => {
    let client;
    try {
        const {
            patientName,
            hospitalName,
            bloodGroup,
            unitsRequired,
            urgency = URGENCY_LEVEL.NORMAL,
            locationName,
            location,
            latitude,
            longitude,
            contactPhone,
            notes,
            role,
        } = req.body;

        let resolvedLocation = locationName || location;
        if (!resolvedLocation || !hospitalName || !patientName) throw fail('Patient, hospital and location are required.');
        if (role && !(req.user.roles || [req.user.role]).includes(role)) throw fail('Unauthorized request role.', 403);
        const deadline = req.body.requiredBefore ? new Date(req.body.requiredBefore) : new Date(Date.now() + 24 * 3600000);
        if (!Number.isFinite(deadline.getTime()) || deadline <= new Date()) throw fail('Required time must be in the future.');
        let coords = resolveCoordinates(latitude, longitude);

        const allowedRequesterRoles = ['hospital', 'patient', 'blood_bank', 'donor', 'ngo'];
        const effectiveRequesterRole = role && allowedRequesterRoles.includes(role)
            ? role
            : (allowedRequesterRoles.includes(req.user.role) ? req.user.role : 'patient');

        const insertSql = `
            INSERT INTO blood_requests (
                requester_user_id,
                requester_role,
                patient_name,
                hospital_name,
                blood_group,
                units_required,
                urgency,
                location_name,
                geom,
                contact_phone,
                notes,
                status, required_before, assigned_hospital_id
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                ST_SetSRID(ST_MakePoint($9, $10), 4326),
                $11, $12, $13, $14, $15
            )
            RETURNING *;
        `;

        if (effectiveRequesterRole === 'ngo' && !(await db.query("SELECT id FROM ngos WHERE user_id=$1 AND verification_status='verified'",[req.user.id])).rowCount) throw fail('NGO verification is required.',403);
        let hospitalId = req.body.hospitalId || null;
        if (effectiveRequesterRole === 'hospital') {
            const h = await db.query("SELECT id FROM hospitals WHERE user_id=$1 AND verification_status='verified'", [req.user.id]);
            if (!h.rowCount) throw fail('Hospital verification is required.', 403);
            hospitalId = h.rows[0].id;
        }
        if (hospitalId && !(await db.query("SELECT id FROM hospitals WHERE id=$1 AND verification_status='verified'", [hospitalId])).rowCount) throw fail('Select a verified hospital.');
        let destinationName = hospitalName;
        if (hospitalId) {
            const destination = (await db.query('SELECT hospital_name,address,ST_X(geom) AS longitude,ST_Y(geom) AS latitude FROM hospitals WHERE id=$1',[hospitalId])).rows[0];
            coords = destination; destinationName = destination.hospital_name; resolvedLocation = destination.address;
        }
        const values = [
            req.user.id,
            effectiveRequesterRole,
            patientName || 'Emergency Patient',
            destinationName,
            bloodGroup,
            parseInt(unitsRequired || 1, 10),
            urgency,
            resolvedLocation,
            coords.longitude,
            coords.latitude,
            contactPhone || req.user.phone,
            notes || null,
            REQUEST_STATUS.ACTIVE,
            deadline,
            hospitalId,
        ];

        client = await db.getClient();
        await client.query('BEGIN');
        await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [req.user.id]);
        const duplicate=await client.query("SELECT id FROM blood_requests WHERE requester_user_id=$1 AND blood_group=$2 AND lower(hospital_name)=lower($3) AND status IN ('active','matching') AND created_at>NOW()-INTERVAL '5 minutes'",[req.user.id,bloodGroup,destinationName]);
        if(duplicate.rowCount) throw fail('A similar active request was just created. Use that request instead.',409);
        const result = await client.query(insertSql, values);
        await client.query('COMMIT');
        client.release();client=null;
        const newRequest = result.rows[0];

        // Trigger hyperlocal matching engine asynchronously or synchronously
        let matchResult = { matchedCount: 0, donors: [] };
        try {
            matchResult = await donorMatchingService.matchAndNotifyDonors(newRequest);
        } catch (matchErr) {
            console.error('Matching engine notification error:', matchErr.message);
        }

        return apiSuccess(
            res,
            {
                request: newRequest,
                matchedDonorsCount: matchResult.matchedCount,
                matchedDonors: matchResult.donors.map(safeDonor),
            },
            `Blood request created successfully! Matched with ${matchResult.matchedCount} nearby donors.`,
            201
        );
    } catch (error) {
        if(client) await client.query('ROLLBACK');
        next(error);
    } finally {client?.release();}
};

/**
 * Get active blood requests with filtering (matches existing frontend BloodRequests.jsx)
 */
const getAllRequests = async (req, res, next) => {
    try {
        const {
            bloodGroup = '',
            urgency = '',
            search = '',
            status = 'active',
        } = req.query;

        let sql = `
            SELECT
                br.id,
                br.blood_group AS "bloodGroup",
                br.hospital_name AS hospital,
                'Destination shared after requester approval' AS location,
                CONCAT(br.units_required, ' Unit', CASE WHEN br.units_required > 1 THEN 's' ELSE '' END) AS units,
                br.units_required AS "unitsRequired",
                br.units_fulfilled AS "unitsFulfilled",
                br.urgency,
                br.status,

                br.requester_user_id AS "requesterUserId",
                br.created_at AS "createdAt"
            FROM blood_requests br
            WHERE (br.required_before IS NULL OR br.required_before > NOW() OR br.status NOT IN ('active','matching'))
        `;

        const values = [];

        if (status && status !== 'all') {
            values.push(status);
            sql += status === 'active' ? ` AND br.status IN ('active', 'matching')` : ` AND br.status = $${values.length}`;
            if (status === 'active') values.pop();
        }

        if (bloodGroup) {
            values.push(bloodGroup);
            sql += ` AND br.blood_group = $${values.length}`;
        }

        if (urgency) {
            values.push(urgency);
            sql += ` AND br.urgency = $${values.length}`;
        }

        if (search) {
            values.push(`%${search.toLowerCase()}%`);
            sql += ` AND (
                LOWER(br.hospital_name) LIKE $${values.length}
            )`;
        }

        // Sort Critical first, then Urgent, then Normal, then newest
        sql += `
            ORDER BY
                CASE
                    WHEN br.urgency = 'Critical' THEN 1
                    WHEN br.urgency = 'Urgent' THEN 2
                    ELSE 3
                END,
                br.created_at DESC
            LIMIT 50;
        `;

        const result = await db.query(sql, values);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Get requests created by logged in user
 */
const getMyRequests = async (req, res, next) => {
    try {
        const query = `
            SELECT
                br.id,
                br.blood_group AS "bloodGroup",
                br.hospital_name AS hospital,
                br.location_name AS location,
                br.units_required AS "unitsRequired",
                br.units_fulfilled AS "unitsFulfilled",
                br.urgency,
                br.status,
                br.patient_name AS "patientName",
                br.created_at AS "createdAt",
                (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id) AS "matchedCount",
                (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id AND dm.match_status = 'accepted') AS "acceptedCount"
            FROM blood_requests br
            WHERE br.requester_user_id = $1 OR br.assigned_hospital_id IN (SELECT id FROM hospitals WHERE user_id=$1 AND verification_status='verified')
            ORDER BY br.created_at DESC;
        `;
        const result = await db.query(query, [req.user.id]);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Get single request details along with matched candidate donors
 */
const getRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestQuery = `
            SELECT
                br.*,
                ST_Y(br.geom) AS latitude,
                ST_X(br.geom) AS longitude
            FROM blood_requests br
            WHERE br.id = $1;
        `;
        const reqResult = await db.query(requestQuery, [id]);

        if (reqResult.rows.length === 0) {
            return apiError(res, 'Blood request not found', 404);
        }

        const request = reqResult.rows[0];
        const hospital = await db.query('SELECT id FROM hospitals WHERE user_id=$1 AND id=$2', [req.user.id, request.assigned_hospital_id]);
        if (request.requester_user_id !== req.user.id && req.user.role !== 'admin' && !hospital.rowCount) throw fail('Request details are private.', 403);

        // Fetch matched candidate donors
        const matchesQuery = `
            SELECT
                dm.id AS "matchId",
                dm.distance_meters AS "distanceMeters",
                ROUND((dm.distance_meters / 1000.0)::numeric, 2) AS "distanceKm",
                dm.is_exact_group AS "isExactGroup",
                dm.match_status AS "matchStatus",
                dm.requester_decision AS "requesterDecision",
                dm.notified_at AS "notifiedAt",
                dm.responded_at AS "respondedAt",
                d.id AS "donorId",
                d.full_name AS "donorName",
                d.blood_group AS "donorBloodGroup",
                d.location_name AS "donorLocation",
                CASE WHEN dm.match_status IN ('accepted','completed') THEN u.phone ELSE NULL END AS "donorPhone"
            FROM donor_matches dm
            JOIN donors d ON dm.donor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE dm.blood_request_id = $1
            ORDER BY dm.is_exact_group DESC, dm.distance_meters ASC;
        `;
        const matchesResult = await db.query(matchesQuery, [id]);

        return apiSuccess(res, {
            request,
            matches: matchesResult.rows,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update request status (e.g. fulfill or cancel)
 */
const updateRequestStatus = async (req, res, next) => {
    let client;
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'cancelled') throw fail('Only cancellation is permitted here. Fulfillment requires verified donation records.');
        client = await db.getClient();
        await client.query('BEGIN');
        const result = await client.query(`UPDATE blood_requests SET status='cancelled', updated_at=NOW()
            WHERE id=$1 AND (requester_user_id=$2 OR $3::boolean) AND status IN ('active','matching') RETURNING *`, [id, req.user.id, req.user.role === 'admin']);
        if (!result.rowCount) throw fail('Request unavailable, closed, or not owned by you.', 409);
        await client.query("UPDATE donor_matches SET match_status='expired', otp_hash=NULL WHERE blood_request_id=$1 AND match_status IN ('notified','accepted')", [id]);
        await client.query(`INSERT INTO notifications(user_id,title,body,type,data_payload)
            SELECT d.user_id,'Request cancelled','A request you were invited to has been cancelled.','request_update',jsonb_build_object('requestId',$1::uuid::text)
            FROM donor_matches dm JOIN donors d ON d.id=dm.donor_id WHERE dm.blood_request_id=$1`, [id]);

        await client.query('COMMIT');
        return apiSuccess(res, result.rows[0], `Blood request status updated to ${status}`);
    } catch (error) {
        if(client) await client.query('ROLLBACK');
        next(error);
    } finally {client?.release();}
};

module.exports = {
    createRequest,
    getAllRequests,
    getMyRequests,
    getRequestById,
    updateRequestStatus,
};
