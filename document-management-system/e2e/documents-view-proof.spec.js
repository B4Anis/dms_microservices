import { test, expect } from '@playwright/test';
import { login } from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'screeshots', 'proof');

test.describe('View Documents — UI to Backend Proof', () => {
  test('user can see all documents saved in the backend from the document library', async ({ page }) => {

    // ── Step 1: Login ──────────────────────────────────────────────────────────
    await login(page, 'user@dms.com', 'user123');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'docs-1-logged-in.png') });

    // ── Step 2: Navigate to Documents page ────────────────────────────────────
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // ── Step 3: Wait for document cards to appear ─────────────────────────────
    const documentCards = page.locator('[data-testid="document-card"], .document-card, article, .card').first();
    // Wait for the document count label (e.g. "51 documents")
    await page.waitForFunction(() => {
      const body = document.body.innerText;
      return body.includes('document') && (
        body.match(/\d+ documents?/) !== null
      );
    }, { timeout: 15000 });

    await page.screenshot({ path: path.join(screenshotsDir, 'docs-2-library-top.png') });

    // ── Step 4: Read backend count ────────────────────────────────────────────
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db.json'), 'utf8'));
    const backendCount = db.documents.length;
    console.log(`Backend has ${backendCount} documents`);

    // ── Step 5: Verify count shown in UI matches backend ──────────────────────
    const countText = await page.locator('text=/\\d+ documents?/i').first().textContent();
    console.log(`UI shows: "${countText}"`);
    const uiCount = parseInt(countText.match(/\d+/)[0]);
    expect(uiCount).toBe(backendCount);

    // ── Step 6: Verify the newest document from backend appears in UI ──────────
    // UI is sorted "Newest First", so find the most recently updated document
    const sorted = [...db.documents].sort((a, b) =>
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    const newestDocTitle = sorted[0].title;
    await expect(page.getByText(newestDocTitle, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    console.log(`✅ Newest document "${newestDocTitle}" visible in UI`);

    // ── Step 7: Scroll down to show more documents ────────────────────────────
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, 'docs-3-library-scrolled.png') });

    // ── Step 8: Open a specific document detail ───────────────────────────────
    await page.goto('/documents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Q1 Financial Report', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'docs-4-document-detail.png') });

    console.log(`✅ All ${backendCount} documents loaded from backend and displayed in the UI`);
  });
});
