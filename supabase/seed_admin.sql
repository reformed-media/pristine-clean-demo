-- =============================================================================
-- seed_admin.sql
-- Link an existing Supabase auth user to admin_users as the first admin.
--
-- PREREQUISITE: The auth user must already exist. Create it via:
--   Supabase Dashboard → Authentication → Users → "Send invitation"
--   (or "Create new user" with Auto Confirm)
-- Then copy the user's UUID from the Users list.
--
-- Fill in all four placeholders below, then run in the SQL Editor.
-- The SQL Editor runs as the postgres superuser, which bypasses RLS.
-- This is required for the first admin insert because the is_admin()
-- check on admin_users would otherwise block it (chicken-and-egg).
-- =============================================================================

insert into admin_users (auth_user_id, first_name, last_name, email, role)
values (
  'REPLACE_WITH_AUTH_USER_UUID',
  'REPLACE_FIRST_NAME',
  'REPLACE_LAST_NAME',
  'REPLACE_EMAIL',
  'owner'
);
