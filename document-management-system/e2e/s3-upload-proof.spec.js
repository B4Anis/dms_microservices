import { test, expect } from '@playwright/test';
import { login } from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'screeshots', 'proof');

test.describe('S3 File Upload — Frontend to MinIO Proof', () => {
  test('uploaded file is stored in MinIO S3 and URL returned to frontend', async ({ page }) => {

    // ── Step 1: Login ──────────────────────────────────────────────────────────
    await login(page, 'user@dms.com', 'user123');
    await page.screenshot({ path: path.join(screenshotsDir, 's3-1-logged-in.png') });

    // ── Step 2: Navigate to Documents ─────────────────────────────────────────
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 's3-2-document-library.png') });

    // ── Step 3: Intercept the POST /api/documents response ────────────────────
    let uploadResponse = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/documents') && response.request().method() === 'POST') {
        try {
          uploadResponse = await response.json();
        } catch (_) {}
      }
    });

    // ── Step 4: Open Upload Modal ──────────────────────────────────────────────
    await page.getByRole('button', { name: /upload document/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(screenshotsDir, 's3-3-upload-modal-step1.png') });

    // ── Step 5: Select a real PDF file ────────────────────────────────────────
    await dialog.locator('input[type="file"]').setInputFiles(
      'C:\\Users\\HP\\Desktop\\4th year\\antigravityec\\LAB_10_MESSAGE-DRIVEN-ARCH.pdf'
    );

    await page.screenshot({ path: path.join(screenshotsDir, 's3-4-file-selected.png') });

    // ── Step 6: Next → metadata step ──────────────────────────────────────────
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(300);

    // Fill title (auto-filled from filename, but let's be explicit)
    const titleInput = dialog.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill('LAB 10 Message-Driven Architecture');

    // Select first available category (required)
    const categorySelect = dialog.locator('select[name="categoryId"]');
    await categorySelect.selectOption({ index: 1 });

    await page.screenshot({ path: path.join(screenshotsDir, 's3-5-metadata-filled.png') });

    // ── Step 7: Click Upload → triggers progress animation + API call ──────────
    await dialog.getByRole('button', { name: /^upload$/i }).click();
    await page.screenshot({ path: path.join(screenshotsDir, 's3-6-upload-progress.png') });

    // ── Step 8: Wait for modal to close (upload complete) ─────────────────────
    await dialog.waitFor({ state: 'hidden', timeout: 20000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 's3-7-upload-complete.png') });

    // ── Step 9: Verify API response has a MinIO fileUrl ───────────────────────
    expect(uploadResponse).not.toBeNull();
    console.log('✅ Spring Boot response:', JSON.stringify(uploadResponse, null, 2));

    expect(uploadResponse.id).toBeTruthy();
    expect(uploadResponse.fileUrl).toBeTruthy();
    expect(uploadResponse.fileUrl).toContain('localhost:9000');
    console.log(`✅ File stored in MinIO S3. URL: ${uploadResponse.fileUrl}`);

    // ── Step 10: Verify file is actually reachable in MinIO ───────────────────
    // Extract just the path portion (presigned URL may include query params)
    const fileKey = uploadResponse.fileUrl.split('/dms-bucket/')[1]?.split('?')[0];
    console.log(`   File key in bucket: ${fileKey}`);

    // List objects in bucket via MinIO API to confirm the file exists
    const bucketContents = execSync(
      'docker exec antigravityec-minio-1 ls /data/dms-bucket/',
      { encoding: 'utf8', timeout: 10000 }
    ).trim();
    expect(bucketContents).toContain(fileKey);
    console.log(`✅ File confirmed in MinIO bucket. Key: ${fileKey}`);

    // ── Step 11: Final screenshot — document detail with fileUrl from MinIO ────
    if (uploadResponse.id) {
      await page.goto(`/documents/${uploadResponse.id}`);
      // Spring Boot returns numeric id; the frontend detail page accepts it
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(screenshotsDir, 's3-8-document-in-db.png') });
    }
  });
});
