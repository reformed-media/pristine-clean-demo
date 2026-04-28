-- =============================================================================
-- seed_demo_data.sql
-- Pristine Clean LI — demo seed: 10 clients, 27 bookings (12 active + 15
-- historical), 4 leads.
--
-- Run in Supabase SQL Editor (service role bypasses RLS).
-- All timestamps are UTC. Eastern Daylight Time = UTC-4:
--   9 AM EDT  = 13:00 UTC
--  10 AM EDT  = 14:00 UTC
--  11 AM EDT  = 15:00 UTC
--   2 PM EDT  = 18:00 UTC
--
-- Every scheduled_at uses CURRENT_DATE so "today's jobs" stay current
-- regardless of when the seed is run.
--
-- lifetime_spend_cents on each client equals the exact sum of
-- final_price_cents across all their completed bookings in this file.
-- =============================================================================

DO $$
DECLARE
  -- Client IDs
  c_ferraro   uuid;
  c_calabrese uuid;
  c_goldstein uuid;
  c_conlon    uuid;
  c_stavros   uuid;
  c_huang     uuid;
  c_obrien    uuid;
  c_napoli    uuid;
  c_reyes     uuid;
  c_kim       uuid;

  -- Vehicle IDs
  v_porsche  uuid;
  v_bmw_m3   uuid;
  v_gwagon   uuid;
  v_range    uuid;
  v_rs5      uuid;
  v_tesla    uuid;
  v_bmw_x7   uuid;
  v_lexus    uuid;
  v_cayenne  uuid;

  -- Address IDs
  a_ferraro   uuid;
  a_calabrese uuid;
  a_goldstein uuid;
  a_conlon    uuid;
  a_stavros   uuid;
  a_huang     uuid;
  a_obrien    uuid;
  a_napoli    uuid;
  a_reyes     uuid;
  a_kim       uuid;

  -- Active / near-term booking IDs (b1–b12)
  b1  uuid; b2  uuid; b3  uuid; b4  uuid;
  b5  uuid; b6  uuid; b7  uuid; b8  uuid;
  b9  uuid; b10 uuid; b11 uuid; b12 uuid;

  -- Historical complete+paid booking IDs (bh1–bh15)
  bh1  uuid; bh2  uuid; bh3  uuid; bh4  uuid; bh5  uuid;
  bh6  uuid; bh7  uuid; bh8  uuid; bh9  uuid; bh10 uuid;
  bh11 uuid; bh12 uuid; bh13 uuid; bh14 uuid; bh15 uuid;

  -- Service IDs (looked up from the initial schema seed)
  svc_full     uuid;
  svc_ext      uuid;
  svc_int      uuid;
  svc_seal     uuid;
  svc_engine   uuid;
  svc_marine   uuid;
  svc_pressure uuid;

BEGIN

  -- ── Service lookups ───────────────────────────────────────────────────────
  SELECT id INTO svc_full     FROM services WHERE slug = 'auto-full-detail';
  SELECT id INTO svc_ext      FROM services WHERE slug = 'auto-exterior-only';
  SELECT id INTO svc_int      FROM services WHERE slug = 'auto-interior-only';
  SELECT id INTO svc_seal     FROM services WHERE slug = 'addon-paint-sealant';
  SELECT id INTO svc_engine   FROM services WHERE slug = 'addon-engine-bay';
  SELECT id INTO svc_marine   FROM services WHERE slug = 'marine-detailing';
  SELECT id INTO svc_pressure FROM services WHERE slug = 'home-pressure-washing';

  -- ── Clients ───────────────────────────────────────────────────────────────
  -- lifetime_spend_cents = exact sum of final_price_cents on completed bookings
  -- below. Verified at the bottom of this file.
  --
  -- Ferraro:   57500+57500+30000+57500+15000 = 217500
  -- Calabrese: 22500+57500+22500            = 102500
  -- Goldstein: 22500+12000                  =  34500
  -- Conlon:    22500+15000                  =  37500
  -- Stavros:   57500                        =  57500
  -- Huang:     22500                        =  22500
  -- O'Brien:   22500                        =  22500
  -- Napoli:    22500                        =  22500
  -- Reyes:     19500                        =  19500
  -- Kim:       15000                        =  15000

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents, notes)
  VALUES ('Michael', 'Ferraro', 'mferraro@gmail.com', '516-555-0182', null,
          217500,
          'Ceramic coated June 2024, daily driver, prefers Saturday mornings, gate code 4421')
  RETURNING id INTO c_ferraro;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Anthony', 'Calabrese', 'acalabrese@gmail.com', '516-555-0293',
          null, 102500)
  RETURNING id INTO c_calabrese;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Jennifer', 'Goldstein', 'jgoldstein@gmail.com', '516-555-0341',
          null, 34500)
  RETURNING id INTO c_goldstein;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Robert', 'Conlon', 'rconlon@gmail.com', '516-555-0458',
          null, 37500)
  RETURNING id INTO c_conlon;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Victoria', 'Stavros', 'vstavros@gmail.com', '516-555-0574',
          null, 57500)
  RETURNING id INTO c_stavros;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('David', 'Huang', 'dhuang@gmail.com', '631-555-0612',
          null, 22500)
  RETURNING id INTO c_huang;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('James', 'O''Brien', 'jobrien@gmail.com', '631-555-0729',
          null, 22500)
  RETURNING id INTO c_obrien;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Patricia', 'Napoli', 'pnapoli@gmail.com', '516-555-0836',
          null, 22500)
  RETURNING id INTO c_napoli;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Christopher', 'Reyes', 'creyes@gmail.com', '516-555-0947',
          null, 19500)
  RETURNING id INTO c_reyes;

  INSERT INTO clients (first_name, last_name, email, phone, auth_user_id,
                       lifetime_spend_cents)
  VALUES ('Danielle', 'Kim', 'dkim@gmail.com', '516-555-0065',
          null, 15000)
  RETURNING id INTO c_kim;

  -- ── Vehicles ──────────────────────────────────────────────────────────────

  -- Ferraro: Porsche 911, BMW M3
  INSERT INTO vehicles (client_id, year, make, model, color, plate, notes)
  VALUES (c_ferraro, 2022, 'Porsche', '911 Carrera S', 'Guards Red', 'NY-PCA-911',
          'Ceramic coated June 2024, daily driver, prefers Saturday mornings, gate code 4421')
  RETURNING id INTO v_porsche;

  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_ferraro, 2021, 'BMW', 'M3 Competition', 'Alpine White', 'NY-M3-BWR')
  RETURNING id INTO v_bmw_m3;

  -- Calabrese: G 63, Range Rover Sport
  INSERT INTO vehicles (client_id, year, make, model, color, plate, notes)
  VALUES (c_calabrese, 2023, 'Mercedes-Benz', 'G 63 AMG', 'Obsidian Black',
          'NY-AMG-G63', 'PPF on front end, very sensitive to water spots')
  RETURNING id INTO v_gwagon;

  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_calabrese, 2022, 'Land Rover', 'Range Rover Sport', 'Fuji White',
          'NY-RRS-CAL')
  RETURNING id INTO v_range;

  -- Goldstein: Audi RS5
  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_goldstein, 2023, 'Audi', 'RS5 Coupe', 'Nardo Gray', 'NY-RS5-GLD')
  RETURNING id INTO v_rs5;

  -- Conlon: Tesla Model S Plaid
  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_conlon, 2023, 'Tesla', 'Model S Plaid', 'Midnight Silver',
          'NY-TES-CON')
  RETURNING id INTO v_tesla;

  -- Stavros: BMW X7
  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_stavros, 2024, 'BMW', 'X7 M60i', 'Carbon Black', 'NY-X7-STV')
  RETURNING id INTO v_bmw_x7;

  -- Huang: Lexus LC 500
  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_huang, 2022, 'Lexus', 'LC 500', 'Flare Yellow', 'NY-LC5-HUA')
  RETURNING id INTO v_lexus;

  -- O'Brien: Porsche Cayenne GTS
  INSERT INTO vehicles (client_id, year, make, model, color, plate)
  VALUES (c_obrien, 2023, 'Porsche', 'Cayenne GTS', 'Chalk', 'NY-CAY-OBR')
  RETURNING id INTO v_cayenne;

  -- ── Addresses ─────────────────────────────────────────────────────────────

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_ferraro, 'Home', '14 Saddlebrook Lane', 'Sands Point', 'NY', '11050', true)
  RETURNING id INTO a_ferraro;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_calabrese, 'Home', '28 Pheasant Run', 'Manhasset', 'NY', '11030', true)
  RETURNING id INTO a_calabrese;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_goldstein, 'Home', '7 Maple Court', 'Great Neck', 'NY', '11021', true)
  RETURNING id INTO a_goldstein;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_conlon, 'Home', '52 Hilton Avenue', 'Garden City', 'NY', '11530', true)
  RETURNING id INTO a_conlon;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_stavros, 'Home', '3 Fox Hollow Road', 'Old Westbury', 'NY', '11568', true)
  RETURNING id INTO a_stavros;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_huang, 'Home', '91 Warner Avenue', 'Roslyn', 'NY', '11576', true)
  RETURNING id INTO a_huang;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_obrien, 'Home', '5 Meadow Lane', 'Lloyd Harbor', 'NY', '11743', true)
  RETURNING id INTO a_obrien;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_napoli, 'Home', '112 Cold Spring Road', 'Syosset', 'NY', '11791', true)
  RETURNING id INTO a_napoli;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_reyes, 'Home', '34 Veterans Memorial Hwy', 'Commack', 'NY', '11725', true)
  RETURNING id INTO a_reyes;

  INSERT INTO client_addresses (client_id, label, street, city, state, zip, is_default)
  VALUES (c_kim, 'Home', '67 Birchwood Park Drive', 'Jericho', 'NY', '11753', true)
  RETURNING id INTO a_kim;

  -- ── Active / near-term bookings (b1–b12) ──────────────────────────────────

  -- [b1] TODAY 10 AM — in_progress — Ferraro / Porsche 911 + Seal
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes, notes)
  VALUES (c_ferraro, v_porsche, a_ferraro,
          (CURRENT_DATE + INTERVAL '14 hours')::timestamptz,
          'in_progress', 120,
          'Ceramic coated — be careful around panel edges. Gate code 4421.')
  RETURNING id INTO b1;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b1, svc_full, 22500), (b1, svc_seal, 35000);

  -- [b2] TODAY 2 PM — confirmed — Calabrese / G 63 Exterior Only
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes)
  VALUES (c_calabrese, v_gwagon, a_calabrese,
          (CURRENT_DATE + INTERVAL '18 hours')::timestamptz,
          'confirmed', 90)
  RETURNING id INTO b2;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b2, svc_ext, 12000);

  -- [b3] +1 day 9 AM — confirmed — Goldstein / RS5 Full + Engine
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes)
  VALUES (c_goldstein, v_rs5, a_goldstein,
          (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '13 hours')::timestamptz,
          'confirmed', 150)
  RETURNING id INTO b3;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b3, svc_full, 22500), (b3, svc_engine, 7500);

  -- [b4] +2 days 11 AM — confirmed — Conlon / Tesla Interior Only
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes)
  VALUES (c_conlon, v_tesla, a_conlon,
          (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '15 hours')::timestamptz,
          'confirmed', 90)
  RETURNING id INTO b4;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b4, svc_int, 15000);

  -- [b5] +4 days 10 AM — confirmed — Stavros / BMW X7 Full Detail
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes)
  VALUES (c_stavros, v_bmw_x7, a_stavros,
          (CURRENT_DATE + INTERVAL '4 days' + INTERVAL '14 hours')::timestamptz,
          'confirmed', 120)
  RETURNING id INTO b5;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b5, svc_full, 22500);

  -- [b6] +6 days 9 AM — confirmed — Huang / Lexus Exterior Only
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes, notes)
  VALUES (c_huang, v_lexus, a_huang,
          (CURRENT_DATE + INTERVAL '6 days' + INTERVAL '13 hours')::timestamptz,
          'confirmed', 90, 'Exterior only this time — skipping interior')
  RETURNING id INTO b6;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b6, svc_ext, 12000);

  -- [b7] +9 days 10 AM — requested — O'Brien / Cayenne Full + Seal
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes)
  VALUES (c_obrien, v_cayenne, a_obrien,
          (CURRENT_DATE + INTERVAL '9 days' + INTERVAL '14 hours')::timestamptz,
          'requested', 150)
  RETURNING id INTO b7;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b7, svc_full, 22500), (b7, svc_seal, 35000);

  -- [b8] +12 days 9 AM — requested — Kim (no vehicle on file yet)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes, notes)
  VALUES (c_kim, null, a_kim,
          (CURRENT_DATE + INTERVAL '12 days' + INTERVAL '13 hours')::timestamptz,
          'requested', 90,
          'Has an Audi Q8 — will add the vehicle when confirmed')
  RETURNING id INTO b8;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b8, svc_ext, 12000);

  -- [b9] -5 days — cancelled — Napoli (rescheduling)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, notes)
  VALUES (c_napoli, null, a_napoli,
          (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '14 hours')::timestamptz,
          'cancelled', 'Client cancelled — rescheduling for next week')
  RETURNING id INTO b9;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b9, svc_int, 15000);

  -- [b10] -14 days — complete + paid — Ferraro / BMW M3 Full + Seal (57500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_ferraro, v_bmw_m3, a_ferraro,
          (CURRENT_DATE - INTERVAL '14 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 180, 57500, 'paid', 'zelle')
  RETURNING id INTO b10;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b10, svc_full, 22500), (b10, svc_seal, 35000);

  -- [b11] -7 days — complete + paid — Calabrese / Range Rover Full (22500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_calabrese, v_range, a_calabrese,
          (CURRENT_DATE - INTERVAL '7 days' + INTERVAL '15 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'cash')
  RETURNING id INTO b11;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b11, svc_full, 22500);

  -- [b12] -3 days — complete + paid — Reyes Exterior + Engine (19500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_reyes, null, a_reyes,
          (CURRENT_DATE - INTERVAL '3 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 90, 19500, 'paid', 'venmo')
  RETURNING id INTO b12;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (b12, svc_ext, 12000), (b12, svc_engine, 7500);

  -- ── Historical bookings (bh1–bh15, all complete + paid) ───────────────────
  -- These justify the lifetime_spend_cents values on each client and make the
  -- booking history tabs look lived-in during the demo.

  -- Ferraro history: 57500+30000+57500+15000 = 160000 (+ b10's 57500 = 217500)

  -- [bh1] -45 days — Ferraro / Porsche Full + Seal (57500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_ferraro, v_porsche, a_ferraro,
          (CURRENT_DATE - INTERVAL '45 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 180, 57500, 'paid', 'zelle')
  RETURNING id INTO bh1;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh1, svc_full, 22500), (bh1, svc_seal, 35000);

  -- [bh2] -90 days — Ferraro / BMW M3 Full + Engine (30000)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_ferraro, v_bmw_m3, a_ferraro,
          (CURRENT_DATE - INTERVAL '90 days' + INTERVAL '13 hours')::timestamptz,
          'complete', 150, 30000, 'paid', 'zelle')
  RETURNING id INTO bh2;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh2, svc_full, 22500), (bh2, svc_engine, 7500);

  -- [bh3] -135 days — Ferraro / Porsche Full + Seal (57500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_ferraro, v_porsche, a_ferraro,
          (CURRENT_DATE - INTERVAL '135 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 180, 57500, 'paid', 'zelle')
  RETURNING id INTO bh3;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh3, svc_full, 22500), (bh3, svc_seal, 35000);

  -- [bh4] -180 days — Ferraro / BMW M3 Interior (15000)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_ferraro, v_bmw_m3, a_ferraro,
          (CURRENT_DATE - INTERVAL '180 days' + INTERVAL '15 hours')::timestamptz,
          'complete', 90, 15000, 'paid', 'cash')
  RETURNING id INTO bh4;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh4, svc_int, 15000);

  -- Calabrese history: 57500+22500 = 80000 (+ b11's 22500 = 102500)

  -- [bh5] -60 days — Calabrese / G 63 Full + Seal (57500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_calabrese, v_gwagon, a_calabrese,
          (CURRENT_DATE - INTERVAL '60 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 180, 57500, 'paid', 'zelle')
  RETURNING id INTO bh5;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh5, svc_full, 22500), (bh5, svc_seal, 35000);

  -- [bh6] -120 days — Calabrese / Range Rover Full (22500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_calabrese, v_range, a_calabrese,
          (CURRENT_DATE - INTERVAL '120 days' + INTERVAL '15 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'cash')
  RETURNING id INTO bh6;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh6, svc_full, 22500);

  -- Goldstein history: 22500+12000 = 34500

  -- [bh7] -45 days — Goldstein / RS5 Full (22500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_goldstein, v_rs5, a_goldstein,
          (CURRENT_DATE - INTERVAL '45 days' + INTERVAL '13 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'venmo')
  RETURNING id INTO bh7;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh7, svc_full, 22500);

  -- [bh8] -90 days — Goldstein / RS5 Exterior (12000)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_goldstein, v_rs5, a_goldstein,
          (CURRENT_DATE - INTERVAL '90 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 90, 12000, 'paid', 'venmo')
  RETURNING id INTO bh8;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh8, svc_ext, 12000);

  -- Conlon history: 22500+15000 = 37500

  -- [bh9] -60 days — Conlon / Tesla Full (22500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_conlon, v_tesla, a_conlon,
          (CURRENT_DATE - INTERVAL '60 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'cash')
  RETURNING id INTO bh9;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh9, svc_full, 22500);

  -- [bh10] -120 days — Conlon / Tesla Interior (15000)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_conlon, v_tesla, a_conlon,
          (CURRENT_DATE - INTERVAL '120 days' + INTERVAL '15 hours')::timestamptz,
          'complete', 90, 15000, 'paid', 'cash')
  RETURNING id INTO bh10;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh10, svc_int, 15000);

  -- Stavros history: 57500

  -- [bh11] -75 days — Stavros / X7 Full + Seal (57500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_stavros, v_bmw_x7, a_stavros,
          (CURRENT_DATE - INTERVAL '75 days' + INTERVAL '13 hours')::timestamptz,
          'complete', 180, 57500, 'paid', 'zelle')
  RETURNING id INTO bh11;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh11, svc_full, 22500), (bh11, svc_seal, 35000);

  -- Huang history: 22500

  -- [bh12] -90 days — Huang / Lexus Full (22500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_huang, v_lexus, a_huang,
          (CURRENT_DATE - INTERVAL '90 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'venmo')
  RETURNING id INTO bh12;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh12, svc_full, 22500);

  -- O'Brien history: 22500

  -- [bh13] -100 days — O'Brien / Cayenne Full (22500)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_obrien, v_cayenne, a_obrien,
          (CURRENT_DATE - INTERVAL '100 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'cash')
  RETURNING id INTO bh13;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh13, svc_full, 22500);

  -- Napoli history: 22500

  -- [bh14] -60 days — Napoli Full (22500) — predates the cancelled booking
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_napoli, null, a_napoli,
          (CURRENT_DATE - INTERVAL '60 days' + INTERVAL '14 hours')::timestamptz,
          'complete', 120, 22500, 'paid', 'cash')
  RETURNING id INTO bh14;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh14, svc_full, 22500);

  -- Kim history: 15000

  -- [bh15] -60 days — Kim Interior (15000)
  INSERT INTO bookings (client_id, vehicle_id, address_id, scheduled_at,
                        status, estimated_duration_minutes,
                        final_price_cents, payment_status, payment_method)
  VALUES (c_kim, null, a_kim,
          (CURRENT_DATE - INTERVAL '60 days' + INTERVAL '15 hours')::timestamptz,
          'complete', 90, 15000, 'paid', 'venmo')
  RETURNING id INTO bh15;
  INSERT INTO booking_services (booking_id, service_id, price_cents_at_booking)
  VALUES (bh15, svc_int, 15000);

  -- ── Leads ─────────────────────────────────────────────────────────────────

  -- [1] New — Marcus DeLuca, Ferraro referral, C8 Corvette
  INSERT INTO leads (first_name, last_name, phone, email, source, status, notes)
  VALUES ('Marcus', 'DeLuca', '516-555-0119', 'mdeluca@gmail.com',
          'Referral (Ferraro)', 'new',
          'Has a new C8 Corvette. Said Ferraro recommended us. Wants full detail + possible paint sealant. Call him back before Thursday.');

  -- [2] Quoted — Sandra Bloom, Instagram, 26ft Sea Ray
  INSERT INTO leads (first_name, last_name, phone, email, source, status,
                     quoted_price_cents, notes)
  VALUES ('Sandra', 'Bloom', '516-555-0227', 'sbloom@gmail.com',
          'Instagram', 'quoted', 40000,
          '26ft Sea Ray. Quoted $400 for marine detailing. Waiting to hear back.');

  -- [3] Scheduled — Tommy Reyes, car show, Challenger Hellcat
  INSERT INTO leads (first_name, last_name, phone, source, status,
                     quoted_price_cents, notes)
  VALUES ('Tommy', 'Reyes', '631-555-0388', 'Car show (Eisenhower Park)',
          'scheduled', 22500,
          '2020 Dodge Challenger Hellcat. Quoted $225. Scheduling for next week.');

  -- [4] Lost — Kevin Park, ghosted after quote
  INSERT INTO leads (first_name, last_name, phone, email, source, status,
                     quoted_price_cents, notes)
  VALUES ('Kevin', 'Park', '516-555-0493', 'kpark@gmail.com',
          'Google', 'lost', 22500,
          'Quoted full detail on a 2022 BMW 3-Series. Stopped responding after receiving quote.');

END $$;

-- =============================================================================
-- Lifetime spend verification (run separately after the DO block succeeds):
--
-- SELECT c.first_name || ' ' || c.last_name AS client,
--        c.lifetime_spend_cents,
--        COALESCE(SUM(b.final_price_cents), 0) AS actual_complete_sum,
--        c.lifetime_spend_cents - COALESCE(SUM(b.final_price_cents), 0) AS diff
-- FROM clients c
-- LEFT JOIN bookings b ON b.client_id = c.id AND b.status = 'complete'
-- WHERE c.auth_user_id IS NULL
-- GROUP BY c.id, c.first_name, c.last_name, c.lifetime_spend_cents
-- ORDER BY c.last_name;
--
-- All diff values should be 0.
-- =============================================================================
