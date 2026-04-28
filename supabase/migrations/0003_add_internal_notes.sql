-- Add internal_notes to bookings (admin-only field, not queried by client-side code)
alter table bookings add column if not exists internal_notes text;
