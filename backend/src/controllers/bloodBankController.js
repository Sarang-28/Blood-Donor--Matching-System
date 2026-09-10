const db = require('../config/db');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Get logged-in Blood Bank profile
 */
const getProfile = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                b.id,
                b.blood_bank_name,
                b.license_number,
                b.director_name,
                b.contact_number,
                b.operating_hours,
                b.address,
                b.verification_status,
                b.verified_at,
                ST_Y(b.geom) AS latitude,
                ST_X(b.geom) AS longitude,
                u.email,
                u.phone,
                b.created_at
            FROM blood_banks b
            JOIN users u ON b.user_id = u.id
            WHERE b.user_id = $1;
        `;
        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return apiError(res, 'Blood Bank profile not found', 404);
        }

        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Update Blood Bank profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const {
            bloodBankName,
            directorName,
            contactNumber,
            operatingHours,
            address,
            latitude,
            longitude,
        } = req.body;

        const coords = (latitude && longitude)
            ? resolveCoordinates(latitude, longitude)
            : null;

        const updateSql = `
            UPDATE blood_banks
            SET 
                blood_bank_name = COALESCE($1, blood_bank_name),
                director_name = COALESCE($2, director_name),
                contact_number = COALESCE($3, contact_number),
                operating_hours = COALESCE($4, operating_hours),
                address = COALESCE($5, address),
                geom = CASE 
                    WHEN $6::numeric IS NOT NULL AND $7::numeric IS NOT NULL 
                    THEN ST_SetSRID(ST_MakePoint($7, $6), 4326)
                    ELSE geom 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $8
            RETURNING id, blood_bank_name, license_number, director_name, contact_number, operating_hours, address, verification_status;
        `;

        const values = [
            bloodBankName || null,
            directorName || null,
            contactNumber || null,
            operatingHours || null,
            address || null,
            coords ? coords.latitude : null,
            coords ? coords.longitude : null,
            req.user.id,
        ];

        const result = await db.query(updateSql, values);
        if (result.rows.length === 0) {
            return apiError(res, 'Blood Bank profile not found', 404);
        }

        return apiSuccess(res, result.rows[0], 'Blood Bank profile updated successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * Public list of Blood Banks
 */
const getBloodBanksList = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                b.id,
                b.blood_bank_name,
                b.director_name,
                b.contact_number,
                b.operating_hours,
                b.address,
                b.verification_status,
                ST_Y(b.geom) AS latitude,
                ST_X(b.geom) AS longitude
            FROM blood_banks b
            JOIN users u ON b.user_id = u.id
            WHERE u.is_active = TRUE
            ORDER BY b.verification_status DESC, b.blood_bank_name ASC;
        `;
        const result = await db.query(query);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Get inventory units for a blood bank
 */
const getInventory = async (req, res, next) => {
    try {
        let bloodBankId = req.params.id;

        if (!bloodBankId) {
            const bbRes = await db.query('SELECT id FROM blood_banks WHERE user_id = $1', [req.user.id]);
            if (bbRes.rows.length === 0) {
                return apiError(res, 'Blood Bank not found', 404);
            }
            bloodBankId = bbRes.rows[0].id;
        }

        const query = `
            SELECT blood_group, units_available, last_updated
            FROM blood_inventory
            WHERE blood_bank_id = $1
            ORDER BY blood_group;
        `;
        const result = await db.query(query, [bloodBankId]);

        // Map existing rows or initialize missing blood groups with 0
        const inventoryMap = {};
        result.rows.forEach((row) => {
            inventoryMap[row.blood_group] = {
                units: parseInt(row.units_available, 10),
                lastUpdated: row.last_updated,
            };
        });

        const fullInventory = BLOOD_GROUPS.map((bg) => ({
            bloodGroup: bg,
            units: inventoryMap[bg]?.units || 0,
            lastUpdated: inventoryMap[bg]?.lastUpdated || null,
        }));

        return apiSuccess(res, fullInventory);
    } catch (error) {
        next(error);
    }
};

/**
 * Update inventory units for a specific blood group
 */
const updateInventory = async (req, res, next) => {
    try {
        const { bloodGroup, unitsAvailable } = req.body;

        if (!bloodGroup || unitsAvailable === undefined) {
            return apiError(res, 'Blood group and unitsAvailable are required', 400);
        }

        const units = parseInt(unitsAvailable, 10);
        if (isNaN(units) || units < 0) {
            return apiError(res, 'Units available must be a non-negative integer', 400);
        }

        const bbRes = await db.query('SELECT id FROM blood_banks WHERE user_id = $1', [req.user.id]);
        if (bbRes.rows.length === 0) {
            return apiError(res, 'Blood Bank account not found', 404);
        }
        const bloodBankId = bbRes.rows[0].id;

        const upsertSql = `
            INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available, last_updated)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (blood_bank_id, blood_group)
            DO UPDATE SET 
                units_available = $3,
                last_updated = CURRENT_TIMESTAMP
            RETURNING blood_group, units_available, last_updated;
        `;
        const result = await db.query(upsertSql, [bloodBankId, bloodGroup, units]);

        return apiSuccess(res, result.rows[0], `Inventory for ${bloodGroup} updated to ${units} units.`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getBloodBanksList,
    getInventory,
    updateInventory,
};
