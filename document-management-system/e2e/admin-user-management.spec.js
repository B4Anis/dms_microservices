import { test, expect } from '@playwright/test';
import { login, waitForToast, createUser } from './helpers.js';

const ADMIN_EMAIL = 'admin@dms.com';
const ADMIN_PASSWORD = 'admin123';
const NEW_USER = {
  firstName: 'Test',
  lastName: 'UserE2E',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'Password123!',
};

test.describe('Admin - User Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
  });

  test('should display User Management page after admin login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible();
  });

  test('should show user table with data', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should open create user modal when Add User is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/add new user/i)).toBeVisible();
  });

  test('should validate required fields in create user form', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    
    // Try submitting empty form
    await dialog.getByRole('button', { name: /create user/i }).click();
    // Check for error messages using role="alert" which we confirmed is present
    await expect(dialog.getByRole('alert').filter({ hasText: /first name is required/i })).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('alert').filter({ hasText: /last name is required/i })).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('alert').filter({ hasText: /email is required/i })).toBeVisible({ timeout: 5000 });
  });

  test('should create a new user successfully', async ({ page }) => {
    await createUser(page, NEW_USER);
    await waitForToast(page, 'successfully');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should allow searching for users', async ({ page }) => {
    const search = page.getByPlaceholder(/search by name or email/i);
    await search.fill('admin');
    await expect(page.getByText(/admin/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should filter users by role', async ({ page }) => {
    const roleSelect = page.getByRole('combobox').nth(0);
    await roleSelect.selectOption('admin');
    // All visible rows should be admin role - look specifically for badges in the table
    const adminBadges = page.locator('table').getByText(/^ADMIN$/i);
    await expect(adminBadges.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show bulk actions bar when users are selected', async ({ page }) => {
    // Click first row checkbox
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(page.getByText(/users selected/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should open Import Users wizard', async ({ page }) => {
    await page.getByRole('button', { name: /import users/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/import users via csv/i)).toBeVisible();
  });
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ path: `playwright-report/admin-failure-${testInfo.title.replace(/\s+/g, '_')}.png` });
    }
  });
});
