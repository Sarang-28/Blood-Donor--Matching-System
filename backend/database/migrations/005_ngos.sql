CREATE TABLE ngos (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 ngo_name TEXT NOT NULL, registration_number TEXT UNIQUE NOT NULL, coordinator_name TEXT NOT NULL, contact_number TEXT NOT NULL,
 address TEXT NOT NULL, service_area TEXT NOT NULL DEFAULT '', geom GEOMETRY(Point,4326) NOT NULL,
 verification_status verification_status NOT NULL DEFAULT 'pending', verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE request_assignments (
 blood_request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE, ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
 assigned_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(blood_request_id,ngo_id)
);
ALTER TABLE blood_requests DROP CONSTRAINT blood_requests_requester_role_check;
ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_requester_role_check CHECK(requester_role IN ('hospital','patient','blood_bank','donor','ngo'));
ALTER TABLE verifications_log DROP CONSTRAINT verifications_log_target_type_check;
ALTER TABLE verifications_log ADD CONSTRAINT verifications_log_target_type_check CHECK(target_type IN ('hospital','blood_bank','ngo'));
REVOKE ALL ON ngos,request_assignments FROM PUBLIC;
DO $$ DECLARE r TEXT; BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON ngos,request_assignments,system_settings FROM %I',r); END IF; END LOOP; END $$;
