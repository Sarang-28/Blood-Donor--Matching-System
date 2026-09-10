const db = require('../config/db');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get logged-in patient profile
 */
const getProfile = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                p.id,
                p.full_name,
                p.blood_group,
                p.medical_condition,
                p.attending_doctor,
                p.address,
                p.emergency_contact,
                ST_Y(p.geom) AS latitude,
                ST_X(p.geom) AS longitude,
                u.email,
                u.phone,
                p.created_at
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1;
        `;
        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return apiError(res, 'Patient profile not found', 404);
        }

        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Update patient profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const {
            fullName,
            bloodGroup,
            medicalCondition,
            attendingDoctor,
            address,
            emergencyContact,
            latitude,
            longitude,
        } = req.body;

        const coords = (latitude && longitude)
            ? resolveCoordinates(latitude, longitude)
            : null;

        const updateSql = `
            UPDATE patients
            SET 
                full_name = COALESCE($1, full_name),
                blood_group = COALESCE($2, blood_group),
                medical_condition = COALESCE($3, medical_condition),
                attending_doctor = COALESCE($4, attending_doctor),
                address = COALESCE($5, address),
                emergency_contact = COALESCE($6, emergency_contact),
                geom = CASE 
                    WHEN $7::numeric IS NOT NULL AND $8::numeric IS NOT NULL 
                    THEN ST_SetSRID(ST_MakePoint($8, $7), 4326)
                    ELSE geom 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $9
            RETURNING id, full_name, blood_group, medical_condition, attending_doctor, address, emergency_contact;
        `;

        const values = [
            fullName || null,
            bloodGroup || null,
            medicalCondition || null,
            attendingDoctor || null,
            address || null,
            emergencyContact || null,
            coords ? coords.latitude : null,
            coords ? coords.longitude : null,
            req.user.id,
        ];

        const result = await db.query(updateSql, values);
        if (result.rows.length === 0) {
            return apiError(res, 'Patient profile not found', 404);
        }

        return apiSuccess(res, result.rows[0], 'Patient profile updated successfully.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
};
