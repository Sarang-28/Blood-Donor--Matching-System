const db = require('../config/db');
const notificationService = require('../services/notificationService');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get comprehensive Admin Dashboard statistics and feeds
 * Matches fields in frontend AdminDashboard.jsx
 */
const getStats = async (req, res, next) => {
    try {
        // Run aggregation queries in parallel
        const [
            usersCountRes,
            donorsCountRes,
            hospitalsCountRes,
            requestsCountRes,
            pendingVerificationsRes,
            criticalRequestsRes,
            recentUsersRes,
            recentRequestsRes,
        ] = await Promise.all([
            db.query('SELECT COUNT(*) FROM users;'),
            db.query('SELECT COUNT(*) FROM donors;'),
            db.query('SELECT COUNT(*) FROM hospitals;'),
            db.query("SELECT COUNT(*) FROM blood_requests WHERE status IN ('active', 'matching');"),

            // Pending Verifications
            db.query(`
                SELECT
                    'hospital' AS type,
                    h.id,
                    h.hospital_name AS name,
                    h.license_number AS "registrationNo",
                    h.address,
                    h.emergency_contact AS phone,
                    h.created_at AS "createdAt"
                FROM hospitals h
                WHERE h.verification_status = 'pending'
                UNION ALL
                SELECT
                    'blood_bank' AS type,
                    b.id,
                    b.blood_bank_name AS name,
                    b.license_number AS "registrationNo",
                    b.address,
                    b.contact_number AS phone,
                    b.created_at AS "createdAt"
                FROM blood_banks b
                WHERE b.verification_status = 'pending'
                UNION ALL SELECT 'ngo',id,ngo_name,registration_number,address,contact_number,created_at FROM ngos WHERE verification_status='pending'
                ORDER BY "createdAt" DESC
                LIMIT 10;
            `),

            // Critical Blood Requests
            db.query(`
                SELECT
                    br.id,
                    br.blood_group AS "bloodGroup",
                    br.units_required AS units,
                    br.urgency,
                    br.hospital_name AS hospital,
                    br.location_name AS location,
                    br.contact_phone AS phone,
                    br.created_at AS "createdAt"
                FROM blood_requests br
                WHERE br.urgency = 'Critical' AND br.status IN ('active', 'matching')
                ORDER BY br.created_at DESC
                LIMIT 5;
            `),

            // Recently Registered Users
            db.query(`
                SELECT
                    id, email, role, phone, is_active AS "isActive", created_at AS "createdAt"
                FROM users
                ORDER BY created_at DESC
                LIMIT 5;
            `),

            // Recent Blood Requests
            db.query(`
                SELECT
                    id, blood_group AS "bloodGroup", hospital_name AS hospital,
                    location_name AS location, units_required AS units, urgency, status,
                    created_at AS "createdAt"
                FROM blood_requests
                ORDER BY created_at DESC
                LIMIT 5;
            `),
        ]);

        return apiSuccess(res, {
            summary: {
                totalUsers: parseInt(usersCountRes.rows[0].count, 10),
                registeredDonors: parseInt(donorsCountRes.rows[0].count, 10),
                hospitals: parseInt(hospitalsCountRes.rows[0].count, 10),
                activeRequests: parseInt(requestsCountRes.rows[0].count, 10),
            },
            pendingVerifications: pendingVerificationsRes.rows,
            criticalRequests: criticalRequestsRes.rows,
            recentUsers: recentUsersRes.rows,
            recentRequests: recentRequestsRes.rows,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List all users with pagination and role filter
 */
const getUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let sql = `
            SELECT id, email, role, phone, is_active AS "isActive", created_at AS "createdAt"
            FROM users
            WHERE 1=1
        `;
        const values = [];

        if (role) {
            values.push(role);
            sql += ` AND role = $${values.length}`;
        }

        if (search) {
            values.push(`%${search.toLowerCase()}%`);
            sql += ` AND (LOWER(email) LIKE $${values.length} OR phone LIKE $${values.length})`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2};`;
        values.push(parseInt(limit, 10), offset);

        const result = await db.query(sql, values);
        const countRes = await db.query('SELECT COUNT(*) FROM users');

        return apiSuccess(res, {
            users: result.rows,
            total: parseInt(countRes.rows[0].count, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle user active/suspended status
 */
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') return apiError(res,'isActive must be boolean.',400);
        if (id === req.user.id) return apiError(res,'You cannot suspend your own account.',400);
        const updateSql = `
            WITH changed AS (UPDATE users
            SET is_active = $1, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, email, role, is_active AS "isActive"), logged AS (
              INSERT INTO audit_logs(actor_user_id,action,target_id,metadata)
              SELECT $3,'account.status',id,jsonb_build_object('isActive',"isActive") FROM changed RETURNING id
            ) SELECT * FROM changed;
        `;
        const result = await db.query(updateSql, [isActive, id, req.user.id]);

        if (result.rows.length === 0) {
            return apiError(res, 'User not found', 404);
        }

        return apiSuccess(res, result.rows[0], `User account ${isActive ? 'activated' : 'suspended'}`);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve or reject verification for a hospital or NGO
 */
const verifyInstitution = async (req, res, next) => {
    const client = await db.getClient();
    try {
        const { type, id } = req.params; // type: 'hospital' | 'blood_bank' (or 'ngo')
        const { action, remarks } = req.body; // action: 'verified' | 'rejected'
        const normalizedType = type;

        if (!['hospital', 'blood_bank', 'ngo'].includes(normalizedType)) {
            return apiError(res, 'Type must be hospital or blood_bank', 400);
        }
        if (!['verified', 'rejected'].includes(action)) {
            return apiError(res, 'Action must be verified or rejected', 400);
        }

        await client.query('BEGIN');

        let institutionName = '';
        let targetUserId = null;

        if (normalizedType === 'hospital') {
            const updateHosp = await client.query(`
                UPDATE hospitals
                SET
                    verification_status = $1::verification_status,
                    verified_at = CASE WHEN $1::text = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING hospital_name, user_id;
            `, [action, id]);

            if (updateHosp.rows.length === 0) {
                await client.query('ROLLBACK');
                return apiError(res, 'Hospital not found', 404);
            }
            institutionName = updateHosp.rows[0].hospital_name;
            targetUserId = updateHosp.rows[0].user_id;
        } else if (normalizedType === 'ngo') {
            const n = await client.query("UPDATE ngos SET verification_status=$1::verification_status,verified_at=CASE WHEN $1::text='verified' THEN NOW() ELSE NULL END WHERE id=$2 RETURNING ngo_name,user_id",[action,id]);
            if(!n.rowCount) {await client.query('ROLLBACK');return apiError(res,'NGO not found',404);}
            institutionName=n.rows[0].ngo_name;targetUserId=n.rows[0].user_id;
        } else {
            const updateBB = await client.query(`
                UPDATE blood_banks
                SET
                    verification_status = $1::verification_status,
                    verified_at = CASE WHEN $1::text = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING blood_bank_name, user_id;
            `, [action, id]);

            if (updateBB.rows.length === 0) {
                await client.query('ROLLBACK');
                return apiError(res, 'Blood Bank not found', 404);
            }
            institutionName = updateBB.rows[0].blood_bank_name;
            targetUserId = updateBB.rows[0].user_id;
        }

        // Log admin verification audit
        await client.query(`
            INSERT INTO verifications_log (admin_user_id, target_type, target_id, action, remarks)
            VALUES ($1, $2, $3, $4, $5);
        `, [req.user.id, normalizedType, id, action, remarks || null]);

        await client.query('INSERT INTO audit_logs(actor_user_id,action,target_id,metadata) VALUES($1,$2,$3,$4)',[req.user.id,'institution.verification',id,JSON.stringify({type:normalizedType,action})]);
        await client.query('COMMIT');

        // Dispatch notification
        if (targetUserId) {
            await notificationService.notifyVerificationStatus({
                userId: targetUserId,
                institutionName,
                status: action,
                remarks,
            });
        }

        return apiSuccess(res, { id, type, action }, `${institutionName} marked as ${action}.`);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * Real-time monitor of critical and urgent requests
 */
const getCriticalRequests = async (req, res, next) => {
    try {
        const query = `
            SELECT
                br.*,
                ROUND((SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id)::numeric, 0) AS "matchesCount",
                ST_Y(br.geom) AS latitude,
                ST_X(br.geom) AS longitude
            FROM blood_requests br
            WHERE br.urgency IN ('Critical', 'Urgent') AND br.status IN ('active', 'matching')
            ORDER BY br.urgency DESC, br.created_at DESC;
        `;
        const result = await db.query(query);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    updateUserStatus,
    verifyInstitution,
    getCriticalRequests,
};
