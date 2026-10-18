-- Run as database owner in the selected BloodMatch database AFTER migrations.
-- Create bloodmatch_app separately with a secret supplied by your secrets manager.
-- This runtime account must NOT own tables and must NOT be a member of the migration role.
ALTER ROLE bloodmatch_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO bloodmatch_app;
GRANT SELECT, INSERT, UPDATE ON users,donors,hospitals,patients,blood_banks,blood_inventory,blood_requests,donor_matches,donations,notifications,verifications_log,notification_deliveries,ngos,request_assignments,system_settings TO bloodmatch_app;
GRANT SELECT, INSERT ON audit_logs,request_status_history TO bloodmatch_app;
REVOKE DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM bloodmatch_app;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs,request_status_history FROM bloodmatch_app;
GRANT EXECUTE ON FUNCTION record_request_status(),protect_donor_history(),require_reverification() TO bloodmatch_app;
