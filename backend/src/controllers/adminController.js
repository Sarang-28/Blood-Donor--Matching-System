const db = require('../config/db');
const notificationService = require('../services/notificationService');
const { VERIFICATION_STATUS } = require('../constants/statuses');
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
                    'ngo' AS type,
                    n.id,
                    n.ngo_name AS name,
                    n.registration_number AS "registrationNo",
                    n.address,
                    n.contact_number AS phone,
                    n.created_at AS "createdAt"
                FROM ngos n
                WHERE n.verification_status = 'pending'
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

        const updateSql = `
            UPDATE users
            SET is_active = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, email, role, is_active AS "isActive";
        `;
        const result = await db.query(updateSql, [isActive, id]);

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
        const { type, id } = req.params; // type: 'hospital' | 'ngo'
        const { action, remarks } = req.body; // action: 'verified' | 'rejected'

        if (!['hospital', 'ngo'].includes(type)) {
            return apiError(res, 'Type must be hospital or ngo', 400);
        }
        if (!['verified', 'rejected'].includes(action)) {
            return apiError(res, 'Action must be verified or rejected', 400);
        }

        await client.query('BEGIN');

        let institutionName = '';
        let targetUserId = null;

        if (type === 'hospital') {
            const updateHosp = await client.query(`
                UPDATE hospitals
                SET 
                    verification_status = $1,
                    verified_at = CASE WHEN $1 = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END,
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
        } else {
            const updateNgo = await client.query(`
                UPDATE ngos
                SET 
                    verification_status = $1,
                    verified_at = CASE WHEN $1 = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING ngo_name, user_id;
            `, [action, id]);

            if (updateNgo.rows.length === 0) {
                await client.query('ROLLBACK');
                return apiError(res, 'NGO not found', 404);
            }
            institutionName = updateNgo.rows[0].ngo_name;
            targetUserId = updateNgo.rows[0].user_id;
        }

        // Log admin verification audit
        await client.query(`
            INSERT INTO verifications_log (admin_user_id, target_type, target_id, action, remarks)
            VALUES ($1, $2, $3, $4, $5);
        `, [req.user.id, type, id, action, remarks || null]);

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
