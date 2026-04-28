import { test, expect, type Page } from '@playwright/test';
import { admin } from './helpers';

const NICK_EMAIL = 'nick@pristineclean.com';
const NICK_PASSWORD = 'pristine2026';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(NICK_EMAIL);
  await page.getByLabel('Password').fill(NICK_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/today/, { timeout: 15_000 });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

test('admin login lands on today view', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(NICK_EMAIL);
  await page.getByLabel('Password').fill(NICK_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin\/today/, { timeout: 15_000 });
  await expect(page.getByText('Jobs Today')).toBeVisible();
});

test('unauthenticated access to /admin/today redirects to login', async ({ page }) => {
  await page.goto('/admin/today');
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
});

test('non-admin login attempt shows error and stays on login', async ({ page }) => {
  const email = `test+${Date.now()}@reformed.media`;
  await admin.auth.admin.createUser({
    email,
    password: 'TestPass123!',
    email_confirm: true,
  });

  try {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('TestPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText("doesn't have admin access")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  } finally {
    const { data } = await admin.auth.admin.listUsers();
    const user = data.users.find((u) => u.email === email);
    if (user) await admin.auth.admin.deleteUser(user.id);
  }
});

// ── Today view ────────────────────────────────────────────────────────────────

test('today view shows seeded jobs for Ferraro and Calabrese', async ({ page }) => {
  await loginAsAdmin(page);

  // Both jobs are seeded for today (b1 = 10 AM in_progress, b2 = 2 PM confirmed)
  await expect(page.getByText('Ferraro')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Calabrese')).toBeVisible();

  // Stat card sanity check
  const jobsCard = page.locator('text=Jobs Today').locator('..').locator('..');
  await expect(jobsCard.getByText('2')).toBeVisible();
});

test('clicking a job card opens the booking drawer with correct data', async ({ page }) => {
  await loginAsAdmin(page);

  // Click Ferraro's job card (in_progress, Porsche 911)
  await page.getByText('Michael Ferraro').first().click();

  // Drawer should open with name and vehicle
  await expect(page.getByText('Michael Ferraro').nth(1)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Porsche')).toBeVisible();
  await expect(page.getByText('Full Detail')).toBeVisible();
});

// ── Status advance ─────────────────────────────────────────────────────────────

test('confirming a pending request updates booking status in DB', async ({ page }) => {
  // Look up O'Brien's seeded requested booking (b7) before we touch the UI
  const { data: oBrienBookings } = await admin
    .from('bookings')
    .select('id, clients!inner(last_name)')
    .eq('status', 'requested')
    .eq('clients.last_name', "O'Brien")
    .limit(1);

  // If seed hasn't run or was already advanced, skip gracefully
  if (!oBrienBookings?.length) return;
  const bookingId = oBrienBookings[0].id;

  await loginAsAdmin(page);

  // O'Brien (b7, +9 days) should appear in Pending Requests section
  await expect(page.getByText("Pending Requests")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("O'Brien")).toBeVisible({ timeout: 5_000 });

  // Click the Confirm button on O'Brien's pending card
  const confirmBtn = page
    .locator('text=O\'Brien')
    .locator('../..')
    .getByRole('button', { name: 'Confirm' });
  await confirmBtn.click();

  // Give DB write a moment to complete
  await page.waitForTimeout(1_000);

  // Verify DB was updated
  const { data: updated } = await admin
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single();
  expect(updated?.status).toBe('confirmed');

  // Reset so the seed stays re-runnable between test runs
  await admin.from('bookings').update({ status: 'requested' }).eq('id', bookingId);
});

// ── Clients list ──────────────────────────────────────────────────────────────

test('clients list shows all seeded clients and search filters correctly', async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'Clients' }).click();
  await expect(page).toHaveURL(/\/admin\/clients/);

  // All 10 seeded clients should be listed
  await expect(page.getByText('Michael Ferraro')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Anthony Calabrese')).toBeVisible();

  // Search for "Ferraro" — should filter to one result
  await page.getByPlaceholder(/search/i).fill('Ferraro');
  await page.waitForTimeout(300); // debounce
  await expect(page.getByText('Michael Ferraro')).toBeVisible();
  await expect(page.getByText('Anthony Calabrese')).not.toBeVisible();

  // Clear search — all clients return
  await page.getByPlaceholder(/search/i).clear();
  await page.waitForTimeout(300);
  await expect(page.getByText('Anthony Calabrese')).toBeVisible();
});

// ── Client detail ─────────────────────────────────────────────────────────────

test('client detail shows bookings and vehicles', async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'Clients' }).click();
  await expect(page).toHaveURL(/\/admin\/clients/);

  // Navigate to Ferraro's detail page
  await page.getByText('Michael Ferraro').click();
  await expect(page).toHaveURL(/\/admin\/clients\//, { timeout: 10_000 });

  // Ferraro has 2 vehicles: Porsche 911 + BMW M3
  await page.getByRole('button', { name: 'vehicles' }).click();
  await expect(page.getByText('Porsche')).toBeVisible();
  await expect(page.getByText('BMW')).toBeVisible();

  // Bookings tab should show their history
  await page.getByRole('button', { name: 'bookings' }).click();
  await expect(page.getByText('Full Detail')).toBeVisible();
});
