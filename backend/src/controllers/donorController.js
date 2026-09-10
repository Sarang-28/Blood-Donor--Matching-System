const db = require('../config/db');
const donorMatchingService = require('../services/donorMatchingService');
const { resolveCoordinates } = require('../utils/geoUtils');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get logged-in donor's profile
 */
const getProfile = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                d.id,
                d.full_name,
                d.blood_group,
                d.age,
                d.weight_kg,
                d.location_name,
                d.availability_status,
                d.last_donation_date,
                d.emergency_ready,
                d.total_donations,
                ST_Y(d.geom) AS latitude,
                ST_X(d.geom) AS longitude,
                u.email,
                u.phone,
                d.created_at
            FROM donors d
            JOIN users u ON d.user_id = u.id
            WHERE d.user_id = $1;
        `;
        const result = await db.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return apiError(res, 'Donor profile not found.', 404);
        }

        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Update donor profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const {
            fullName,
            bloodGroup,
            age,
            weightKg,
            locationName,
            latitude,
            longitude,
            lastDonationDate,
            emergencyReady,
        } = req.body;

        // Current donor check
        const current = await db.query('SELECT * FROM donors WHERE user_id = $1', [req.user.id]);
        if (current.rows.length === 0) {
            return apiError(res, 'Donor profile not found', 404);
        }
        const existing = current.rows[0];

        const coords = (latitude && longitude)
            ? resolveCoordinates(latitude, longitude)
            : null;

        const updateSql = `
            UPDATE donors
            SET 
                full_name = COALESCE($1, full_name),
                blood_group = COALESCE($2, blood_group),
                age = COALESCE($3, age),
                weight_kg = COALESCE($4, weight_kg),
                location_name = COALESCE($5, location_name),
                last_donation_date = COALESCE($6, last_donation_date),
                emergency_ready = COALESCE($7, emergency_ready),
                geom = CASE 
                    WHEN $8::numeric IS NOT NULL AND $9::numeric IS NOT NULL 
                    THEN ST_SetSRID(ST_MakePoint($9, $8), 4326)
                    ELSE geom 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $10
            RETURNING id, full_name, blood_group, age, weight_kg, location_name, availability_status, last_donation_date, emergency_ready;
        `;

        const values = [
            fullName || null,
            bloodGroup || null,
            age ? parseInt(age, 10) : null,
            weightKg ? parseFloat(weightKg) : null,
            locationName || null,
            lastDonationDate || null,
            typeof emergencyReady === 'boolean' ? emergencyReady : null,
            coords ? coords.latitude : null,
            coords ? coords.longitude : null,
            req.user.id,
        ];

        const result = await db.query(updateSql, values);
        return apiSuccess(res, result.rows[0], 'Donor profile updated successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle availability status (Available / Unavailable)
 */
const toggleAvailability = async (req, res, next) => {
    try {
        const { status } = req.body;
        const targetStatus = status || null;

        let sql = '';
        let params = [];

        if (targetStatus) {
            sql = `
                UPDATE donors 
                SET availability_status = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = $2 
                RETURNING id, full_name, availability_status;
            `;
            params = [targetStatus, req.user.id];
        } else {
            // Flip status
            sql = `
                UPDATE donors 
                SET availability_status = CASE 
                    WHEN availability_status = 'Available' THEN 'Unavailable'::availability_type 
                    ELSE 'Available'::availability_type 
                END,
                updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 
                RETURNING id, full_name, availability_status;
            `;
            params = [req.user.id];
        }

        const result = await db.query(sql, params);
        if (result.rows.length === 0) {
            return apiError(res, 'Donor profile not found', 404);
        }

        return apiSuccess(res, result.rows[0], `Availability status changed to ${result.rows[0].availability_status}`);
    } catch (error) {
        next(error);
    }
};

/**
 * Get donation history
 */
const getDonationHistory = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                d.id,
                d.units_donated,
                d.donation_date,
                d.certificate_number,
                d.notes,
                h.hospital_name,
                h.address AS hospital_address,
                br.patient_name,
                br.blood_group
            FROM donations d
            JOIN donors dn ON d.donor_id = dn.id
            JOIN hospitals h ON d.hospital_id = h.id
            LEFT JOIN blood_requests br ON d.blood_request_id = br.id
            WHERE dn.user_id = $1
            ORDER BY d.donation_date DESC;
        `;
        const result = await db.query(query, [req.user.id]);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Hyperlocal PostGIS donor search
 * Supports:
 * - lat, lng + radiusKm (PostGIS spatial search)
 * - bloodGroup filter
 * - searchQuery / location text search
 */
const getNearbyDonors = async (req, res, next) => {
    try {
        const {
            lat,
            lng,
            radiusKm = 25,
            bloodGroup = '',
            search = '',
        } = req.query;

        // If coordinates provided, run PostGIS ST_DWithin & ST_Distance query
        if (lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusMeters = parseFloat(radiusKm) * 1000;

            const donors = await donorMatchingService.findNearbyCompatibleDonors({
                latitude,
                longitude,
                bloodGroup: bloodGroup || 'O+',
                radiusMeters,
            });

            // If user also typed a text query, filter in addition
            const filtered = search
                ? donors.filter(d => 
                    d.fullName.toLowerCase().includes(search.toLowerCase()) || 
                    d.locationName.toLowerCase().includes(search.toLowerCase())
                  )
                : donors;

            return apiSuccess(res, {
                count: filtered.length,
                donors: filtered.map(d => ({
                    id: d.donorId,
                    name: d.fullName,
                    bloodGroup: d.bloodGroup,
                    location: d.locationName,
                    status: 'Available',
                    distanceKm: d.distanceKm,
                    isExactMatch: d.isExactMatch,
                    phone: d.phone,
                })),
            });
        }

        // Otherwise list donors matching query and blood group
        let sql = `
            SELECT 
                d.id,
                d.full_name AS name,
                d.blood_group AS "bloodGroup",
                d.location_name AS location,
                d.availability_status AS status,
                d.total_donations,
                u.phone
            FROM donors d
            JOIN users u ON d.user_id = u.id
            WHERE u.is_active = TRUE
        `;
        const values = [];

        if (bloodGroup) {
            values.push(bloodGroup);
            sql += ` AND d.blood_group = $${values.length}`;
        }

        if (search) {
            values.push(`%${search.toLowerCase()}%`);
            sql += ` AND (LOWER(d.full_name) LIKE $${values.length} OR LOWER(d.location_name) LIKE $${values.length})`;
        }

        sql += ` ORDER BY d.availability_status ASC, d.full_name ASC LIMIT 50;`;

        const result = await db.query(sql, values);
        return apiSuccess(res, {
            count: result.rows.length,
            donors: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get public profile of a single donor by ID
 */
const getDonorById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                d.id,
                d.full_name AS name,
                d.blood_group AS "bloodGroup",
                d.location_name AS location,
                d.availability_status AS status,
                d.total_donations AS "totalDonations",
                d.last_donation_date AS "lastDonationDate"
            FROM donors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1 AND u.is_active = TRUE;
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return apiError(res, 'Donor not found', 404);
        }
        return apiSuccess(res, result.rows[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    toggleAvailability,
    getDonationHistory,
    getNearbyDonors,
    getDonorById,
};
