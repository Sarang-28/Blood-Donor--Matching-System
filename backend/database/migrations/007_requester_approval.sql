-- Acceptance expresses donor interest; the requester must consent before contact sharing.
ALTER TABLE donor_matches ADD COLUMN requester_decision TEXT NOT NULL DEFAULT 'pending'
    CHECK (requester_decision IN ('pending', 'approved', 'rejected'));
ALTER TABLE donor_matches ADD COLUMN requester_decided_at TIMESTAMPTZ;
ALTER TABLE donor_matches ADD COLUMN requester_decided_by UUID REFERENCES users(id);
CREATE INDEX donor_matches_approved_idx ON donor_matches(blood_request_id)
    WHERE match_status = 'accepted' AND requester_decision = 'approved';
-- Old invitation text included destinations; stop serving that text to pending donors.
UPDATE notifications SET body='A nearby blood request needs your help. Contact details and the exact destination are available after requester approval.'
    WHERE type='match_alert';
