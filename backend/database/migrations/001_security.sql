ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE donor_matches ADD COLUMN IF NOT EXISTS otp_hash TEXT;
ALTER TABLE donor_matches ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
UPDATE donor_matches SET otp_code = NULL, otp_expires_at = NULL WHERE otp_code IS NOT NULL;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS location_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS assigned_hospital_id UUID REFERENCES hospitals(id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique ON users(lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone);
CREATE UNIQUE INDEX IF NOT EXISTS donation_request_donor_unique ON donations(blood_request_id, donor_id) WHERE blood_request_id IS NOT NULL;
ALTER TABLE donations ADD CONSTRAINT donations_units_positive CHECK (units_donated BETWEEN 1 AND 100);
ALTER TABLE blood_requests ADD CONSTRAINT fulfillment_nonnegative CHECK (units_fulfilled >= 0);
CREATE INDEX IF NOT EXISTS donors_geography_idx ON donors USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS request_geography_idx ON blood_requests USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS request_owner_idx ON blood_requests(requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS request_expiry_idx ON blood_requests(required_before) WHERE status IN ('active', 'matching');
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, target_id UUID, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS request_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), blood_request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    old_status TEXT, new_status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('sms','push')), status TEXT NOT NULL CHECK (status IN ('sent','failed','unconfigured','no_consent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION record_request_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
  INSERT INTO request_status_history(blood_request_id,new_status) VALUES(NEW.id,NEW.status::text);
 ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
  INSERT INTO request_status_history(blood_request_id,old_status,new_status) VALUES(NEW.id,OLD.status::text,NEW.status::text);
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS request_status_audit ON blood_requests;
CREATE TRIGGER request_status_audit AFTER INSERT OR UPDATE OF status ON blood_requests FOR EACH ROW EXECUTE FUNCTION record_request_status();
-- Deny accidental direct access by PostgREST/browser roles, where those roles exist.
DO $$ DECLARE r TEXT; t TEXT; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   FOREACH t IN ARRAY ARRAY['users','donors','patients','hospitals','blood_banks','blood_inventory','blood_requests','donor_matches','donations','notifications','verifications_log','audit_logs','request_status_history','notification_deliveries'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',t,r);
   END LOOP;
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON users,donors,patients,hospitals,blood_banks,blood_inventory,blood_requests,donor_matches,donations,notifications,verifications_log,audit_logs,request_status_history,notification_deliveries FROM PUBLIC;
