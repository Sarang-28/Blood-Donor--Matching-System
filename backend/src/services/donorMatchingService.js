const { resolveCoordinates } = require('../utils/geoUtils');
const db = require('../config/db');
const { getCompatibleDonorGroups } = require('../constants/bloodCompatibility');
const { MATCH_STATUS, URGENCY_LEVEL } = require('../constants/statuses');
const notificationService = require('./notificationService');

/**
 * Hyperlocal PostGIS Donor Matching Engine
 */
class DonorMatchingService {
    /**
     * Find nearby compatible donors using PostGIS spatial queries
     *
     * @param {Object} params
     * @param {number} params.latitude
     * @param {number} params.longitude
     * @param {string} params.bloodGroup
     * @param {number} [params.radiusMeters=15000] - Default 15km
     * @param {string} [params.urgency='Normal']
     * @param {number} [params.limit=25]
     * @returns {Promise<Array>}
     */
    async findNearbyCompatibleDonors({
        latitude,
        longitude,
        bloodGroup,
        radiusMeters,
        urgency = URGENCY_LEVEL.NORMAL,
        limit = 25,
    }) {
        const policy = await require('./settingsService')();
        radiusMeters ??= policy.radiusKm * 1000;
        resolveCoordinates(latitude, longitude);
        if (!Number.isFinite(Number(radiusMeters)) || radiusMeters < 1000 || radiusMeters > 100000) throw Object.assign(new Error('Radius must be between 1 and 100 km.'), { statusCode: 400 });
        const searchRadius = radiusMeters;
        const compatibleGroups = getCompatibleDonorGroups(bloodGroup);

        const sql = `
            SELECT
                d.id AS donor_id,
                d.user_id,
                d.full_name,
                d.blood_group,
                d.location_name,
                d.last_donation_date,
                d.total_donations,
                u.phone,
                u.email,
                ROUND((ST_Distance(d.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography))::numeric, 2) AS distance_meters,
                (d.blood_group = $3) AS is_exact_match
            FROM donors d
            JOIN users u ON d.user_id = u.id
            WHERE
                u.is_active = TRUE
                AND d.availability_status = 'Available'
                AND d.location_consent = TRUE
                AND d.age BETWEEN 18 AND 65 AND d.weight_kg >= 45
                AND (d.last_donation_date IS NULL OR d.last_donation_date <= CURRENT_DATE - $7::integer)
                AND ($8::text <> 'Critical' OR d.emergency_ready = TRUE)
                AND d.blood_group = ANY($4::blood_group_type[])
                AND ST_DWithin(
                    d.geom::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $5
                )
            ORDER BY
                is_exact_match DESC,
                distance_meters ASC
            LIMIT $6;
        `;

        const values = [
            longitude,
            latitude,
            bloodGroup,
            compatibleGroups,
            searchRadius,
            limit,
            policy.cooldownDays,
            urgency,
        ];

        const result = await db.query(sql, values);
        return result.rows.map(row => ({
            donorId: row.donor_id,
            userId: row.user_id,
            fullName: row.full_name,
            bloodGroup: row.blood_group,
            locationName: row.location_name,
            lastDonationDate: row.last_donation_date,
            totalDonations: row.total_donations,
            phone: row.phone,
            email: row.email,
            distanceMeters: parseFloat(row.distance_meters),
            distanceKm: parseFloat((row.distance_meters / 1000).toFixed(2)),
            isExactMatch: row.is_exact_match,
        }));
    }

    /**
     * Trigger matching process for an existing blood request,
     * persist matches in `donor_matches` table, and send notifications.
     */
    async matchAndNotifyDonors(bloodRequest, radiusKm) {
        const client = await db.getClient();
        try {
        await client.query('BEGIN');
        const locked = await client.query("SELECT * FROM blood_requests WHERE id=$1 AND status IN ('active','matching') AND (required_before IS NULL OR required_before>NOW()) FOR UPDATE", [bloodRequest.id]);
        if(!locked.rowCount) throw Object.assign(new Error('Request is closed or unavailable.'), {statusCode:409});
        bloodRequest = locked.rows[0];
        const coordsResult = await client.query(`
            SELECT
                ST_X(geom) AS longitude,
                ST_Y(geom) AS latitude
            FROM blood_requests
            WHERE id = $1 AND status IN ('active','matching') AND (required_before IS NULL OR required_before > NOW());
        `, [bloodRequest.id]);

        if (coordsResult.rows.length === 0) {
            throw new Error('Blood request not found');
        }

        const { longitude, latitude } = coordsResult.rows[0];

        const candidateDonors = await this.findNearbyCompatibleDonors({
            latitude,
            longitude,
            bloodGroup: bloodRequest.blood_group,
            urgency: bloodRequest.urgency,
            radiusMeters: radiusKm === undefined ? undefined : radiusKm * 1000,
            limit: 20,
        });

        if (candidateDonors.length === 0) {
            await client.query('COMMIT');
            return {
                matchedCount: 0,
                donors: [],
                message: 'No compatible donors currently available within range.',
            };
        }

        // Insert donor_matches records into database
        const matchPromises = candidateDonors.map(donor => {
            const insertMatchSql = `
                INSERT INTO donor_matches (
                    blood_request_id,
                    donor_id,
                    distance_meters,
                    is_exact_group,
                    match_status,
                    notified_at
                )
                SELECT $1, $2, $3, $4, $5, CURRENT_TIMESTAMP FROM blood_requests WHERE id=$1 AND status IN ('active','matching') AND (required_before IS NULL OR required_before > NOW())
                ON CONFLICT (blood_request_id, donor_id)
                DO NOTHING
                RETURNING id;
            `;
            return client.query(insertMatchSql, [
                bloodRequest.id,
                donor.donorId,
                donor.distanceMeters,
                donor.isExactMatch,
                MATCH_STATUS.NOTIFIED,
            ]);
        });

        const inserted = await Promise.all(matchPromises);
        const newDonors = candidateDonors.filter((_, i) => inserted[i].rowCount > 0);

        // Update request status to 'matching'
        await client.query(
            `UPDATE blood_requests SET status = 'matching' WHERE id = $1 AND status = 'active'`,
            [bloodRequest.id]
        );

        await client.query('COMMIT');

        // Notify each donor via NotificationService
        for (const donor of newDonors) {
            await notificationService.notifyDonorMatch({
                userId: donor.userId,
                phone: donor.phone,
                donorName: donor.fullName,
                bloodGroup: bloodRequest.blood_group,
                units: bloodRequest.units_required,
                urgency: bloodRequest.urgency,
                hospitalName: bloodRequest.hospital_name,
                locationName: bloodRequest.location_name,
                distanceKm: donor.distanceKm,
                requestId: bloodRequest.id,
            }).catch(err => {
                console.error('Match notification failed:', err.code || 'delivery_error');
            });
        }

        return {
            matchedCount: candidateDonors.length,
            donors: candidateDonors,
        };
        } catch(error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
    }
}

module.exports = new DonorMatchingService();
