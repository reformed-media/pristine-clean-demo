-- =============================================================================
-- 0002_auto_create_client_on_signup.sql
-- Auto-create a clients row when a new auth user signs up.
-- Reads first_name, last_name, phone from raw_user_meta_data.
-- =============================================================================

-- Clean slate (safe to re-run)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clients (auth_user_id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
