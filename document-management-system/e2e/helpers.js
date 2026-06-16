import { expect } from '@playwright/test';

/**
 * Reusable E2E test helpers for the Document Management System.
 */

/**
 * Fast login by injecting user directly into localStorage (bypasses API).
 * Falls back to UI login if user object not provided.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
  // First navigate to the app so localStorage is accessible
  await page.goto('/login');

  // Fill form using stable ID selectors
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to documents or admin
  await page.waitForURL(/(documents|admin)/, { timeout: 15000 });
}

/**
 * Wait for a toast notification containing the given text.
 * @param {import('@playwright/test').Page} page
 * @param {string} text - partial text to match
 */
export async function waitForToast(page, text) {
  // Toast containers are typically role="alert" or have a toast class
  await expect(page.getByText(text, { exact: false })).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Upload a document through the upload modal using a fake in-memory file.
 * @param {import('@playwright/test').Page} page
 * @param {{ title: string, description?: string }} data
 */
export async function uploadDocument(page, data) {
  await page.getByRole('button', { name: /upload document/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });

  // Set a fake file on the hidden file input
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'e2e-test-file.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 E2E test content'),
  });

  // Proceed to metadata step
  const nextBtn = dialog.getByRole('button', { name: /next/i });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();

  // Fill metadata - wait for transition to Step 2
  const titleInput = dialog.locator('input[name="title"]');
  await titleInput.waitFor({ state: 'visible' });
  await titleInput.fill(data.title);
  
  if (data.description) {
    await dialog.locator('textarea[name="description"]').fill(data.description);
  }

  // Select first available category option
  const categorySelect = dialog.locator('select[name="categoryId"]');
  await categorySelect.selectOption({ index: 1 });

  // Final upload button
  const finalUploadBtn = dialog.getByRole('button', { name: /^upload$/i });
  await finalUploadBtn.waitFor({ state: 'visible' });
  await finalUploadBtn.click();
}

/**
 * Fill in and submit the Create User modal.
 * @param {import('@playwright/test').Page} page
 * @param {{ firstName: string, lastName: string, email: string, password: string }} data
 */
export async function createUser(page, data) {
  await page.getByRole('button', { name: /add user/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });

  // Use name attribute selectors for reliability
  await dialog.locator('input[name="firstName"]').fill(data.firstName);
  await dialog.locator('input[name="lastName"]').fill(data.lastName);
  await dialog.locator('input[name="email"]').fill(data.email);
  await dialog.locator('input[name="password"]').fill(data.password);
  await dialog.locator('input[name="confirmPassword"]').fill(data.password);

  await dialog.getByRole('button', { name: /create user/i }).click();
}
