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
        radiusMeters = 15000,
        urgency = URGENCY_LEVEL.NORMAL,
        limit = 25,
    }) {
        // Expand radius automatically for critical emergencies
        let searchRadius = radiusMeters;
        if (urgency === URGENCY_LEVEL.CRITICAL) {
            searchRadius = Math.max(searchRadius, 30000); // at least 30km for critical
        } else if (urgency === URGENCY_LEVEL.URGENT) {
            searchRadius = Math.max(searchRadius, 20000); // at least 20km for urgent
        }

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
                AND (d.last_donation_date IS NULL OR d.last_donation_date <= CURRENT_DATE - INTERVAL '90 days')
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
    async matchAndNotifyDonors(bloodRequest) {
        const coordsResult = await db.query(`
            SELECT 
                ST_X(geom) AS longitude,
                ST_Y(geom) AS latitude
            FROM blood_requests
            WHERE id = $1;
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
            radiusMeters: 15000,
            limit: 20,
        });

        if (candidateDonors.length === 0) {
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
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                ON CONFLICT (blood_request_id, donor_id) 
                DO UPDATE SET 
                    distance_meters = EXCLUDED.distance_meters,
                    notified_at = CURRENT_TIMESTAMP
                RETURNING id;
            `;
            return db.query(insertMatchSql, [
                bloodRequest.id,
                donor.donorId,
                donor.distanceMeters,
                donor.isExactMatch,
                MATCH_STATUS.NOTIFIED,
            ]);
        });

        await Promise.all(matchPromises);

        // Update request status to 'matching'
        await db.query(
            `UPDATE blood_requests SET status = 'matching' WHERE id = $1 AND status = 'active'`,
            [bloodRequest.id]
        );

        // Notify each donor via NotificationService
        for (const donor of candidateDonors) {
            notificationService.notifyDonorMatch({
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
                console.error(`Notification failed for donor ${donor.fullName}:`, err.message);
            });
        }

        return {
            matchedCount: candidateDonors.length,
            donors: candidateDonors,
        };
    }
}

module.exports = new DonorMatchingService();
