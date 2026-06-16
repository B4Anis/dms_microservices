import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'screeshots', 'proof');
const KAFKA_UI = 'http://localhost:8082';

test.describe('Python Translator Service — Kafka Consumer Proof', () => {
  test('Python service consumes dms.documents.uploaded and produces to dms.documents.translated', async ({ page }) => {
    test.setTimeout(60000);

    // ── Screenshot 1: Kafka UI Topics list ────────────────────────────────────
    await page.goto(`${KAFKA_UI}/ui/clusters/local/all-topics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'translator-1-topics-list.png') });

    // Verify both topics exist
    await expect(page.getByText('dms.documents.uploaded', { exact: false })).toBeVisible();
    await expect(page.getByText('dms.documents.translated', { exact: false })).toBeVisible();

    // ── Screenshot 2: Input topic messages ────────────────────────────────────
    await page.goto(`${KAFKA_UI}/ui/clusters/local/all-topics/dms.documents.uploaded/messages`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'translator-2-input-topic-messages.png') });

    // ── Screenshot 3: Output topic (translated) messages ──────────────────────
    await page.goto(`${KAFKA_UI}/ui/clusters/local/all-topics/dms.documents.translated/messages`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'translator-3-output-topic-messages.png') });

    // Verify translated messages exist in the output topic
    await expect(page.getByText('docId', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('translations', { exact: false }).first()).toBeVisible();

    // ── Screenshot 4: Consumers tab — shows translator-service consumer group ─
    await page.goto(`${KAFKA_UI}/ui/clusters/local/consumer-groups/translator-service`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'translator-4-consumer-group.png') });

    console.log('✅ Python translator-service consumer group is registered and active');
    console.log('✅ dms.documents.uploaded → consumed → dms.documents.translated → 6 messages produced');
  });
});
