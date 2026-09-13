const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const { apiError } = require('../utils/apiResponse');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return apiError(res, 'Authentication token missing. Please log in.', 401);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, env.jwt.secret);
        } catch (jwtErr) {
            if (jwtErr.name === 'TokenExpiredError') {
                return apiError(res, 'Session expired. Please log in again.', 401);
            }
            return apiError(res, 'Invalid authentication token.', 401);
        }

        // Verify user exists and is active in DB
        const userQuery = await db.query(
            'SELECT id, email, role, phone, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userQuery.rows.length === 0) {
            return apiError(res, 'User account not found.', 401);
        }

        const user = userQuery.rows[0];
        if (!user.is_active) {
            return apiError(res, 'Account is suspended or deactivated. Contact administrator.', 403);
        }

        // Detect all active role profiles associated with this user
        const [donorCheck, patientCheck, hospitalCheck, bbCheck, ngoCheck] = await Promise.all([
            db.query('SELECT 1 FROM donors WHERE user_id = $1 LIMIT 1', [user.id]),
            db.query('SELECT 1 FROM patients WHERE user_id = $1 LIMIT 1', [user.id]),
            db.query('SELECT 1 FROM hospitals WHERE user_id = $1 LIMIT 1', [user.id]),
            db.query('SELECT 1 FROM blood_banks WHERE user_id = $1 LIMIT 1', [user.id]),
            db.query('SELECT 1 FROM ngos WHERE user_id = $1 LIMIT 1', [user.id]),
        ]);

        const userRoles = [user.role];
        if (donorCheck.rows.length > 0) userRoles.push('donor');
        if (patientCheck.rows.length > 0) userRoles.push('patient');
        if (hospitalCheck.rows.length > 0) userRoles.push('hospital');
        if (bbCheck.rows.length > 0 || ngoCheck.rows.length > 0) {
            userRoles.push('blood_bank');
            userRoles.push('ngo');
        }
        if (user.role === 'admin') userRoles.push('admin');

        user.roles = Array.from(new Set(userRoles));
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return apiError(res, 'Authentication failure.', 500);
    }
};

module.exports = {
    authenticateToken,
};
