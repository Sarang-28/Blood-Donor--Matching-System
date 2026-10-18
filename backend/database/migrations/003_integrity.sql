CREATE OR REPLACE FUNCTION protect_donor_history() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest DATE;
BEGIN
 SELECT MAX(donation_date) INTO latest FROM donations WHERE donor_id=NEW.id;
 IF latest IS NOT NULL AND (NEW.last_donation_date IS NULL OR NEW.last_donation_date<latest) THEN NEW.last_donation_date=latest; END IF;
 IF NEW.last_donation_date>CURRENT_DATE THEN RAISE EXCEPTION 'Future donation date' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS donor_history_guard ON donors;
CREATE TRIGGER donor_history_guard BEFORE UPDATE OF last_donation_date ON donors FOR EACH ROW EXECUTE FUNCTION protect_donor_history();
CREATE TABLE IF NOT EXISTS system_settings(key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
REVOKE ALL ON system_settings FROM PUBLIC;
