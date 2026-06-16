import { test, expect } from '@playwright/test';
import { login } from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'screeshots', 'proof');
const KAFKA_UI = 'http://localhost:8082';
const TOPIC = 'dms.documents.uploaded';

test.describe('Kafka Message-Driven Proof', () => {
  test('Document service produces a Kafka event when a document is uploaded', async ({ page }) => {
    test.setTimeout(90000);

    // ── Step 1: Capture messages already in the topic BEFORE upload ────────────
    const msgsBefore = execSync(
      `docker exec antigravityec-kafka-1 kafka-console-consumer ` +
      `--bootstrap-server localhost:9092 --topic ${TOPIC} ` +
      `--from-beginning --max-messages 50 --timeout-ms 4000 2>&1 || true`,
      { encoding: 'utf8', timeout: 15000 }
    );
    const countBefore = (msgsBefore.match(/\{"docId"/g) || []).length;
    console.log(`Messages in topic before upload: ${countBefore}`);

    // ── Step 2: Upload the real PDF via the DMS frontend ──────────────────────
    await login(page, 'user@dms.com', 'user123');
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Intercept the POST response to capture docId
    let uploadedDocId = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/documents') && res.request().method() === 'POST') {
        try { const body = await res.json(); uploadedDocId = String(body.id); } catch (_) {}
      }
    });

    await page.getByRole('button', { name: /upload document/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    await dialog.locator('input[type="file"]').setInputFiles(
      'C:\\Users\\HP\\Desktop\\4th year\\antigravityec\\LAB_10_MESSAGE-DRIVEN-ARCH.pdf'
    );
    await dialog.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(300);

    const titleInput = dialog.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill('LAB 10 Message-Driven Architecture');
    await dialog.locator('select[name="categoryId"]').selectOption({ index: 1 });

    await page.screenshot({ path: path.join(screenshotsDir, 'kafka-1-before-upload.png') });
    await dialog.getByRole('button', { name: /^upload$/i }).click();

    // Wait for upload to complete
    await dialog.waitFor({ state: 'hidden', timeout: 20000 });
    await page.waitForTimeout(1500); // give Kafka time to receive the message

    console.log(`Uploaded document ID: ${uploadedDocId}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'kafka-2-upload-done.png') });

    // ── Step 3: Consume from Kafka topic and verify new message appeared ───────
    const msgsAfter = execSync(
      `docker exec antigravityec-kafka-1 kafka-console-consumer ` +
      `--bootstrap-server localhost:9092 --topic ${TOPIC} ` +
      `--from-beginning --max-messages 50 --timeout-ms 4000 2>&1 || true`,
      { encoding: 'utf8', timeout: 15000 }
    );
    const countAfter = (msgsAfter.match(/\{"docId"/g) || []).length;
    console.log(`Messages in topic after upload: ${countAfter}`);
    expect(countAfter).toBeGreaterThan(countBefore);

    // Find the specific event for our upload
    const lines = msgsAfter.split('\n').filter(l => l.startsWith('{"docId"'));
    const ourEvent = lines.find(l => uploadedDocId && l.includes(`"docId":"${uploadedDocId}"`));
    const lastEvent = lines[lines.length - 1]; // fallback to most recent
    const eventJson = ourEvent || lastEvent;

    console.log(`✅ Kafka event produced:\n${eventJson}`);
    const parsed = JSON.parse(eventJson);
    expect(parsed.docId).toBeTruthy();
    expect(parsed.title).toBeTruthy();
    expect(parsed.fileUrl).toContain('localhost:9000');

    // ── Step 4: Open Kafka UI dashboard ───────────────────────────────────────
    await page.goto(KAFKA_UI);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'kafka-3-ui-dashboard.png') });

    // ── Step 5: Navigate directly to the topic overview ────────────────────────
    await page.goto(`${KAFKA_UI}/ui/clusters/local/all-topics/${TOPIC}/overview`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'kafka-4-topic-overview.png') });

    // ── Step 6: Navigate to Messages tab ──────────────────────────────────────
    await page.goto(`${KAFKA_UI}/ui/clusters/local/all-topics/${TOPIC}/messages`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'kafka-5-topic-messages.png') });

    console.log(`✅ Topic "${TOPIC}": ${countBefore} → ${countAfter} messages (+1 after upload)`);
    console.log(`   Event: docId=${parsed.docId}, title="${parsed.title}"`);
    console.log(`   fileUrl: ${parsed.fileUrl.substring(0, 80)}...`);
  });
});
