CREATE UNIQUE INDEX users_normalized_phone_unique ON users(regexp_replace(phone,'[^0-9]','','g'));
CREATE INDEX donations_donor_idx ON donations(donor_id,donation_date DESC);
CREATE INDEX assignments_ngo_idx ON request_assignments(ngo_id);
CREATE OR REPLACE FUNCTION require_reverification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.address IS DISTINCT FROM NEW.address OR OLD.geom IS DISTINCT FROM NEW.geom THEN
  NEW.verification_status='pending'; NEW.verified_at=NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER hospital_reverification BEFORE UPDATE OF address,geom ON hospitals FOR EACH ROW EXECUTE FUNCTION require_reverification();
CREATE TRIGGER bank_reverification BEFORE UPDATE OF address,geom ON blood_banks FOR EACH ROW EXECUTE FUNCTION require_reverification();
CREATE TRIGGER ngo_reverification BEFORE UPDATE OF address,geom ON ngos FOR EACH ROW EXECUTE FUNCTION require_reverification();
ALTER TABLE donors ADD CONSTRAINT donor_coordinates_valid CHECK(ST_X(geom) BETWEEN -180 AND 180 AND ST_Y(geom) BETWEEN -90 AND 90);
ALTER TABLE hospitals ADD CONSTRAINT hospital_coordinates_valid CHECK(ST_X(geom) BETWEEN -180 AND 180 AND ST_Y(geom) BETWEEN -90 AND 90);
ALTER TABLE blood_requests ADD CONSTRAINT request_coordinates_valid CHECK(ST_X(geom) BETWEEN -180 AND 180 AND ST_Y(geom) BETWEEN -90 AND 90);
