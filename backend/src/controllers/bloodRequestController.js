const db = require('../config/db');
const donorMatchingService = require('../services/donorMatchingService');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');
const { REQUEST_STATUS, URGENCY_LEVEL } = require('../constants/statuses');

/**
 * Create a new blood request and immediately match nearby eligible donors
 */
const createRequest = async (req, res, next) => {
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
        } = req.body;

        const resolvedLocation = locationName || location || 'Pune, Maharashtra';
        const coords = resolveCoordinates(latitude, longitude);

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
                status
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                ST_SetSRID(ST_MakePoint($9, $10), 4326),
                $11, $12, $13
            )
            RETURNING *;
        `;

        const values = [
            req.user.id,
            req.user.role,
            patientName || 'Emergency Patient',
            hospitalName || 'Local Medical Center',
            bloodGroup,
            parseInt(unitsRequired || 1, 10),
            urgency,
            resolvedLocation,
            coords.longitude,
            coords.latitude,
            contactPhone || req.user.phone,
            notes || null,
            REQUEST_STATUS.ACTIVE,
        ];

        const result = await db.query(insertSql, values);
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
                matchedDonors: matchResult.donors,
            },
            `Blood request created successfully! Matched with ${matchResult.matchedCount} nearby donors.`,
            201
        );
    } catch (error) {
        next(error);
    }
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
                br.location_name AS location,
                CONCAT(br.units_required, ' Unit', CASE WHEN br.units_required > 1 THEN 's' ELSE '' END) AS units,
                br.units_required AS "unitsRequired",
                br.units_fulfilled AS "unitsFulfilled",
                br.urgency,
                br.status,
                br.patient_name AS "patientName",
                br.contact_phone AS "contactPhone",
                br.notes,
                br.created_at AS "createdAt",
                ST_Y(br.geom) AS latitude,
                ST_X(br.geom) AS longitude
            FROM blood_requests br
            WHERE 1=1
        `;

        const values = [];

        if (status && status !== 'all') {
            values.push(status);
            sql += ` AND (br.status = $${values.length} OR br.status = 'matching')`;
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
                LOWER(br.location_name) LIKE $${values.length} OR 
                LOWER(br.hospital_name) LIKE $${values.length} OR
                LOWER(br.patient_name) LIKE $${values.length}
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
            WHERE br.requester_user_id = $1
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

        // Fetch matched candidate donors
        const matchesQuery = `
            SELECT 
                dm.id AS "matchId",
                dm.distance_meters AS "distanceMeters",
                ROUND((dm.distance_meters / 1000.0)::numeric, 2) AS "distanceKm",
                dm.is_exact_group AS "isExactGroup",
                dm.match_status AS "matchStatus",
                dm.notified_at AS "notifiedAt",
                dm.responded_at AS "respondedAt",
                d.id AS "donorId",
                d.full_name AS "donorName",
                d.blood_group AS "donorBloodGroup",
                d.location_name AS "donorLocation",
                u.phone AS "donorPhone"
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
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(REQUEST_STATUS).includes(status)) {
            return apiError(res, `Invalid status. Must be one of: ${Object.values(REQUEST_STATUS).join(', ')}`, 400);
        }

        const updateSql = `
            UPDATE blood_requests
            SET 
                status = $1,
                fulfilled_at = CASE WHEN $1 = 'fulfilled' THEN CURRENT_TIMESTAMP ELSE fulfilled_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;
        const result = await db.query(updateSql, [status, id]);

        if (result.rows.length === 0) {
            return apiError(res, 'Blood request not found', 404);
        }

        return apiSuccess(res, result.rows[0], `Blood request status updated to ${status}`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRequest,
    getAllRequests,
    getMyRequests,
    getRequestById,
    updateRequestStatus,
};
