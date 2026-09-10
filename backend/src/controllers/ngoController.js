const db = require('../config/db');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get logged-in NGO profile
 */
const getProfile = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                n.id,
                n.ngo_name,
                n.registration_number,
                n.coordinator_name,
                n.contact_number,
                n.areas_of_operation,
                n.address,
                n.verification_status,
                n.verified_at,
                ST_Y(n.geom) AS latitude,
                ST_X(n.geom) AS longitude,
                u.email,
                u.phone,
                n.created_at
            FROM ngos n
            JOIN users u ON n.user_id = u.id
            WHERE n.user_id = $1;
        `;
        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return apiError(res, 'NGO profile not found', 404);
        }

        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Update NGO profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const {
            ngoName,
            coordinatorName,
            contactNumber,
            areasOfOperation,
            address,
            latitude,
            longitude,
        } = req.body;

        const coords = (latitude && longitude)
            ? resolveCoordinates(latitude, longitude)
            : null;

        const updateSql = `
            UPDATE ngos
            SET 
                ngo_name = COALESCE($1, ngo_name),
                coordinator_name = COALESCE($2, coordinator_name),
                contact_number = COALESCE($3, contact_number),
                areas_of_operation = COALESCE($4, areas_of_operation),
                address = COALESCE($5, address),
                geom = CASE 
                    WHEN $6::numeric IS NOT NULL AND $7::numeric IS NOT NULL 
                    THEN ST_SetSRID(ST_MakePoint($7, $6), 4326)
                    ELSE geom 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $8
            RETURNING id, ngo_name, registration_number, coordinator_name, contact_number, areas_of_operation, address, verification_status;
        `;

        const values = [
            ngoName || null,
            coordinatorName || null,
            contactNumber || null,
            areasOfOperation || null,
            address || null,
            coords ? coords.latitude : null,
            coords ? coords.longitude : null,
            req.user.id,
        ];

        const result = await db.query(updateSql, values);
        if (result.rows.length === 0) {
            return apiError(res, 'NGO profile not found', 404);
        }

        return apiSuccess(res, result.rows[0], 'NGO profile updated successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * Public list of NGOs
 */
const getNgoList = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                n.id,
                n.ngo_name,
                n.coordinator_name,
                n.contact_number,
                n.areas_of_operation,
                n.address,
                n.verification_status
            FROM ngos n
            JOIN users u ON n.user_id = u.id
            WHERE u.is_active = TRUE
            ORDER BY n.verification_status DESC, n.ngo_name ASC;
        `;
        const result = await db.query(query);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getNgoList,
};
