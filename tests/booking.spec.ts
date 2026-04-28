import { test, expect } from '@playwright/test';
import { admin, testEmail, cleanupTestUsers } from './helpers';

test.afterAll(async () => {
  await cleanupTestUsers();
});

test('new client signs up and books Full Detail + Paint Sealant', async ({ page }) => {
  const email = testEmail();
  const password = 'TestPass123!';

  await page.goto('/book');

  // Wait for services to load
  await expect(page.getByText('Full Detail')).toBeVisible({ timeout: 10_000 });

  // Step 1: Pick Full Detail
  await page.getByRole('button', { name: /Full Detail/ }).first().click();

  // Add-ons should appear — pick Paint Sealant
  await expect(page.getByText('Add-ons')).toBeVisible();
  await page.getByRole('button', { name: /Paint Sealant/ }).click();

  // Verify total
  await expect(page.getByText('$575.00')).toBeVisible();

  // Continue to Step 2
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2: Vehicle details
  await expect(page.getByText('Your vehicle.')).toBeVisible();
  await page.getByLabel(/Year/i).fill('2024');
  await page.getByLabel(/Make/i).fill('BMW');
  await page.getByLabel(/Model/i).fill('M3');
  await page.getByLabel(/^Color$/i).fill('Black');

  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 3: Schedule
  await expect(page.getByText('Schedule & location.')).toBeVisible();

  // Pick a future date — tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  await page.getByLabel(/Date/i).fill(dateStr);

  // Pick time slot
  await page.getByLabel(/Time/i).selectOption('9:00 AM');

  // Address
  await page.getByLabel(/Service Address/i).fill('123 Test St, Garden City, NY 11530');

  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 4: Account info
  await expect(page.getByText('Your info.')).toBeVisible();
  await page.getByLabel(/First Name/i).fill('TestFirst');
  await page.getByLabel(/Last Name/i).fill('TestLast');
  await page.getByLabel(/Phone/i).fill('5551234567');
  await page.getByLabel(/^Email$/i).fill(email);
  await page.getByLabel(/^Password$/i).fill(password);
  await page.getByLabel(/Confirm Password/i).fill(password);

  // Submit
  await page.getByRole('button', { name: 'Confirm Booking' }).click();

  // Should redirect to dashboard with success banner
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByText(/Booking received/i)).toBeVisible();
  // Booking card shows combined service names with total
  await expect(page.getByText(/Full Detail.*Paint Sealant/i)).toBeVisible();

  // SQL spot check — find the most recent booking
  const { data: bookings, error: qErr } = await admin
    .from('bookings')
    .select('status, payment_status, booking_services(price_cents_at_booking)')
    .order('created_at', { ascending: false })
    .limit(1);

  expect(qErr).toBeNull();
  expect(bookings).not.toBeNull();
  expect(bookings!.length).toBe(1);
  expect(bookings![0].status).toBe('requested');
  expect(bookings![0].payment_status).toBe('unpaid');
  const total = (bookings![0].booking_services as any[]).reduce(
    (s: number, r: any) => s + r.price_cents_at_booking, 0
  );
  expect(total).toBe(57500);
});

test('existing client books a marine service', async ({ page }) => {
  const email = testEmail();

  // Pre-create user via admin API
  await admin.auth.admin.createUser({
    email,
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: { first_name: 'Marine', last_name: 'Tester' },
  });

  // Log in via UI
  await page.goto('/book?tab=existing');
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill('TestPass123!');
  await page.getByRole('button', { name: /Log in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  // Start booking from dashboard
  await page.getByText(/Book your next service/i).click();
  await expect(page).toHaveURL(/\/book/);

  // Step 1: Pick marine service
  await expect(page.getByText('Boat & Jetski Detailing')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /Boat & Jetski Detailing/ }).click();

  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2: Boat details
  await expect(page.getByText('Your boat.')).toBeVisible();
  await page.getByLabel(/Boat or Jetski/i).fill('Jetski');
  await page.getByLabel(/Length/i).fill('12');

  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 3: Schedule — this is the final step for logged-in users
  await expect(page.getByText('Schedule & location.')).toBeVisible();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const dateStr = tomorrow.toISOString().split('T')[0];
  await page.getByLabel(/Date/i).fill(dateStr);
  await page.getByLabel(/Time/i).selectOption('11:00 AM');
  await page.getByLabel(/Service Address/i).fill('456 Marina Rd, Oyster Bay, NY 11771');

  // For logged-in users, Step 3 button says "Confirm Booking"
  await page.getByRole('button', { name: 'Confirm Booking' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByText(/Booking received/i)).toBeVisible();
  await expect(page.getByText(/Boat & Jetski/i)).toBeVisible();
});

test('quick rebook pre-selects the correct service', async ({ page }) => {
  await page.goto('/book?service=auto-full-detail');

  // Wait for services to load
  await expect(page.getByText('Full Detail')).toBeVisible({ timeout: 10_000 });

  // The Full Detail button should have the selected styling (border-primary bg-primary/10)
  const fullDetailBtn = page.getByRole('button', { name: /Full Detail/ }).first();
  await expect(fullDetailBtn).toHaveClass(/border-primary/);
  await expect(fullDetailBtn).toHaveClass(/bg-primary/);
});
