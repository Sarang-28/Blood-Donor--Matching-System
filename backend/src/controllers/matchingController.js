const db = require('../config/db');
const donorMatchingService = require('../services/donorMatchingService');
const notificationService = require('../services/notificationService');
const { MATCH_STATUS, REQUEST_STATUS } = require('../constants/statuses');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get match alerts sent to current logged in donor
 */
const getMyMatchAlerts = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                dm.id AS "matchId",
                dm.distance_meters AS "distanceMeters",
                ROUND((dm.distance_meters / 1000.0)::numeric, 2) AS "distanceKm",
                dm.is_exact_group AS "isExactGroup",
                dm.match_status AS "matchStatus",
                dm.notified_at AS "notifiedAt",
                dm.responded_at AS "respondedAt",
                br.id AS "requestId",
                br.blood_group AS "bloodGroup",
                br.units_required AS "unitsRequired",
                br.urgency,
                br.hospital_name AS "hospitalName",
                br.location_name AS "locationName",
                br.contact_phone AS "contactPhone",
                br.status AS "requestStatus"
            FROM donor_matches dm
            JOIN donors d ON dm.donor_id = d.id
            JOIN blood_requests br ON dm.blood_request_id = br.id
            WHERE d.user_id = $1
            ORDER BY 
                CASE WHEN dm.match_status = 'notified' THEN 1 ELSE 2 END,
                dm.notified_at DESC;
        `;
        const result = await db.query(query, [req.user.id]);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Donor responds to an emergency match alert (Accept or Decline)
 */
const respondToMatch = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { response } = req.body; // 'accepted' | 'declined'

        if (!['accepted', 'declined'].includes(response)) {
            return apiError(res, 'Response must be either "accepted" or "declined"', 400);
        }

        // Verify that this match belongs to the logged-in donor
        const verifySql = `
            SELECT dm.*, d.full_name, br.requester_user_id, br.hospital_name, br.blood_group
            FROM donor_matches dm
            JOIN donors d ON dm.donor_id = d.id
            JOIN blood_requests br ON dm.blood_request_id = br.id
            WHERE dm.id = $1 AND d.user_id = $2;
        `;
        const verifyRes = await db.query(verifySql, [matchId, req.user.id]);

        if (verifyRes.rows.length === 0) {
            return apiError(res, 'Match alert not found or unauthorized', 404);
        }

        const matchRecord = verifyRes.rows[0];

        // Update match status
        const updateSql = `
            UPDATE donor_matches
            SET 
                match_status = $1,
                responded_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;
        const result = await db.query(updateSql, [response, matchId]);

        // If donor accepted, notify the requester
        if (response === 'accepted') {
            await notificationService.notifyRequesterStatusUpdate({
                userId: matchRecord.requester_user_id,
                title: '❤️ Donor Accepted Your Request!',
                body: `Donor ${matchRecord.full_name} has accepted the request for ${matchRecord.blood_group} at ${matchRecord.hospital_name}.`,
                requestId: matchRecord.blood_request_id,
                newStatus: 'donor_accepted',
            });
        }

        return apiSuccess(
            res,
            result.rows[0],
            response === 'accepted'
                ? 'Thank you! You have accepted the request. Hospital staff has been notified.'
                : 'Match response recorded.'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Manually trigger or re-run donor matching for a specific request with custom radius
 */
const matchRequest = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { radiusKm = 15 } = req.body;

        const reqQuery = await db.query('SELECT * FROM blood_requests WHERE id = $1', [requestId]);
        if (reqQuery.rows.length === 0) {
            return apiError(res, 'Blood request not found', 404);
        }

        const bloodReq = reqQuery.rows[0];
        const matchResult = await donorMatchingService.matchAndNotifyDonors(bloodReq);

        return apiSuccess(
            res,
            matchResult,
            `Matching engine executed: found ${matchResult.matchedCount} compatible donors.`
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Record a completed donation (hospital verifies donor has given blood)
 */
const recordDonation = async (req, res, next) => {
    const client = await db.getClient();
    try {
        const {
            bloodRequestId,
            donorId,
            unitsDonated = 1,
            notes,
        } = req.body;

        await client.query('BEGIN');

        // Look up hospital ID for this user
        const hospQuery = await client.query('SELECT id FROM hospitals WHERE user_id = $1', [req.user.id]);
        if (hospQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return apiError(res, 'Only registered hospitals can record completed donations.', 403);
        }
        const hospitalId = hospQuery.rows[0].id;

        const certNumber = `CERT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 1. Insert into donations table
        const donationInsert = await client.query(`
            INSERT INTO donations (
                blood_request_id,
                donor_id,
                hospital_id,
                units_donated,
                donation_date,
                certificate_number,
                notes
            )
            VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
            RETURNING *;
        `, [bloodRequestId || null, donorId, hospitalId, unitsDonated, certNumber, notes || null]);

        // 2. Update donor's last donation date and total donation count
        await client.query(`
            UPDATE donors
            SET 
                last_donation_date = CURRENT_DATE,
                total_donations = total_donations + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2;
        `, [unitsDonated, donorId]);

        // 3. Update match status to 'completed' if match exists
        if (bloodRequestId) {
            await client.query(`
                UPDATE donor_matches
                SET match_status = 'completed'
                WHERE blood_request_id = $1 AND donor_id = $2;
            `, [bloodRequestId, donorId]);

            // Update units fulfilled on blood request
            await client.query(`
                UPDATE blood_requests
                SET 
                    units_fulfilled = units_fulfilled + $1,
                    status = CASE 
                        WHEN units_fulfilled + $1 >= units_required THEN 'fulfilled'::request_status
                        ELSE status
                    END,
                    fulfilled_at = CASE 
                        WHEN units_fulfilled + $1 >= units_required THEN CURRENT_TIMESTAMP
                        ELSE fulfilled_at
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2;
            `, [unitsDonated, bloodRequestId]);
        }

        await client.query('COMMIT');

        return apiSuccess(
            res,
            donationInsert.rows[0],
            'Donation recorded and verified successfully. Donor statistics updated.',
            201
        );
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

module.exports = {
    getMyMatchAlerts,
    respondToMatch,
    matchRequest,
    recordDonation,
};
