import { test, expect } from '@playwright/test';
import { login, waitForToast, uploadDocument } from './helpers.js';

const USER_EMAIL = 'user@dms.com';
const USER_PASSWORD = 'user123';
const DOC_TITLE = 'Test Document E2E';

test.describe('User - Document Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await login(page, USER_EMAIL, USER_PASSWORD);
  });

  test('should redirect to /documents after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/documents/);
  });

  test('should display the document library page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /document library/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upload document/i })).toBeVisible();
  });

  test('should open upload modal when Upload Document is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /upload document/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/upload document/i).first()).toBeVisible();
  });

  test('should validate file selection before proceeding', async ({ page }) => {
    await page.getByRole('button', { name: /upload document/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    
    // Next button should be disabled before file is selected
    const nextButton = dialog.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeDisabled();
  });

  test('should upload a document and show success toast', async ({ page }) => {
    await uploadDocument(page, {
      title: DOC_TITLE,
      description: 'This is a test document created by E2E tests',
    });
    await waitForToast(page, 'successfully');
  });

  test('should show uploaded document in the list', async ({ page }) => {
    await uploadDocument(page, { title: DOC_TITLE });
    await waitForToast(page, 'successfully');
    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    // Document should appear in the list
    await expect(page.getByText(DOC_TITLE)).toBeVisible({ timeout: 5000 });
  });

  test('should filter documents using search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('Annual');
    await expect(page.getByText(/annual/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should navigate to document detail page on click', async ({ page }) => {
    // Click first document card
    await page.getByRole('article').first().click();
    await expect(page).toHaveURL(/\/documents\/.+/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('should display document detail metadata', async ({ page }) => {
    await page.getByRole('article').first().click();
    await expect(page.getByText(/category/i)).toBeVisible();
    await expect(page.getByText(/department/i)).toBeVisible();
  });
});
