-- Add case-insensitive index on profiles.name for faster name-based lookups
-- during spreadsheet synchronization
CREATE INDEX IF NOT EXISTS profiles_name_lower_idx
  ON public.profiles (LOWER(TRIM(name)));

-- Note: Existing leads currently assigned to the admin user will be
-- re-attributed to their correct responsible team member on the next
-- run of the sync-external-spreadsheet edge function. The edge function
-- now correctly maps the RESPONSÁVEL column from the spreadsheet to
-- profile IDs using exact, case-insensitive, trimmed matching.
--
-- Audit logging: Any user_id changes during sync are recorded in
-- audit_logs with action_type 'UPDATE' and metadata including
-- responsibility_changed, previous_user_id, and new_user_id fields.
