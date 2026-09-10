const db = require('../config/db');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get logged-in hospital profile
 */
const getProfile = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                h.id,
                h.hospital_name,
                h.license_number,
                h.address,
                h.emergency_contact,
                h.speciality,
                h.verification_status,
                h.verified_at,
                ST_Y(h.geom) AS latitude,
                ST_X(h.geom) AS longitude,
                u.email,
                u.phone,
                h.created_at
            FROM hospitals h
            JOIN users u ON h.user_id = u.id
            WHERE h.user_id = $1;
        `;
        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return apiError(res, 'Hospital profile not found', 404);
        }

        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Update hospital profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const {
            hospitalName,
            address,
            emergencyContact,
            speciality,
            latitude,
            longitude,
        } = req.body;

        const coords = (latitude && longitude)
            ? resolveCoordinates(latitude, longitude)
            : null;

        const updateSql = `
            UPDATE hospitals
            SET 
                hospital_name = COALESCE($1, hospital_name),
                address = COALESCE($2, address),
                emergency_contact = COALESCE($3, emergency_contact),
                speciality = COALESCE($4, speciality),
                geom = CASE 
                    WHEN $5::numeric IS NOT NULL AND $6::numeric IS NOT NULL 
                    THEN ST_SetSRID(ST_MakePoint($6, $5), 4326)
                    ELSE geom 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $7
            RETURNING id, hospital_name, license_number, address, emergency_contact, speciality, verification_status;
        `;

        const values = [
            hospitalName || null,
            address || null,
            emergencyContact || null,
            speciality || null,
            coords ? coords.latitude : null,
            coords ? coords.longitude : null,
            req.user.id,
        ];

        const result = await db.query(updateSql, values);
        if (result.rows.length === 0) {
            return apiError(res, 'Hospital profile not found', 404);
        }

        return apiSuccess(res, result.rows[0], 'Hospital profile updated successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * Public list of hospitals
 */
const getHospitalList = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                h.id,
                h.hospital_name,
                h.address,
                h.emergency_contact,
                h.speciality,
                h.verification_status,
                ST_Y(h.geom) AS latitude,
                ST_X(h.geom) AS longitude
            FROM hospitals h
            JOIN users u ON h.user_id = u.id
            WHERE u.is_active = TRUE
            ORDER BY h.verification_status DESC, h.hospital_name ASC;
        `;
        const result = await db.query(query);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Get single hospital by ID
 */
const getHospitalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                h.id,
                h.hospital_name,
                h.license_number,
                h.address,
                h.emergency_contact,
                h.speciality,
                h.verification_status
            FROM hospitals h
            WHERE h.id = $1;
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return apiError(res, 'Hospital not found', 404);
        }
        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getHospitalList,
    getHospitalById,
};
