import { test, expect } from '@playwright/test';
import { login } from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'screeshots', 'proof');

test.describe('Comment Feature — UI to Backend Proof', () => {
  test('user can add a comment to a document and it persists to the backend', async ({ page }) => {
    // ── Step 1: Login ──────────────────────────────────────────────────────────
    await login(page, 'user@dms.com', 'user123');
    await page.screenshot({ path: path.join(screenshotsDir, '1-logged-in.png'), fullPage: false });

    // ── Step 2: Navigate to Document Detail page ───────────────────────────────
    await page.goto('/documents/1');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '2-document-detail.png'), fullPage: false });

    // ── Step 3: Scroll to Comments Section ────────────────────────────────────
    const commentsHeading = page.getByRole('heading', { name: /comments/i });
    await commentsHeading.waitFor({ state: 'visible', timeout: 10000 });
    await commentsHeading.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, '3-comments-section-empty.png'), fullPage: false });

    // ── Step 4: Record comments count before adding ────────────────────────────
    const dbBefore = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db.json'), 'utf8'));
    const countBefore = dbBefore.comments.filter(c => String(c.documentId) === '1').length;

    // ── Step 5: Type and submit a comment ─────────────────────────────────────
    const testComment = `E2E proof comment — added at ${new Date().toISOString()}`;
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10000 });
    await textarea.fill(testComment);
    await page.screenshot({ path: path.join(screenshotsDir, '4-comment-typed.png'), fullPage: false });

    const submitBtn = page.getByRole('button', { name: /post comment|submit|add comment/i }).first();
    await submitBtn.click();

    // ── Step 6: Verify comment appears in the UI ───────────────────────────────
    await expect(page.getByText(testComment)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '5-comment-visible-in-UI.png'), fullPage: false });

    // ── Step 7: Verify it was actually saved to the backend (db.json) ──────────
    // Give JSON-server a moment to flush to disk
    await page.waitForTimeout(500);
    const dbAfter = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db.json'), 'utf8'));
    const savedComment = dbAfter.comments.find(c => c.content === testComment);

    expect(savedComment).toBeTruthy();
    expect(String(savedComment.documentId)).toBe('1');

    // Final annotated screenshot: scroll comments into full view
    await page.getByText(testComment).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, '6-comment-saved-proof.png'), fullPage: false });

    console.log('✅ Comment saved to backend db.json:', JSON.stringify(savedComment, null, 2));
    console.log(`   Comments for doc 1 before: ${countBefore} → after: ${dbAfter.comments.filter(c => String(c.documentId) === '1').length}`);
  });
});
