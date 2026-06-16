const { chromium } = require('./document-management-system/node_modules/playwright');
const path = require('path');

(async () => {
  const htmlPath = path.resolve(__dirname, 'ARCHITECTURE.html');
  const pdfPath  = path.resolve(__dirname, 'ARCHITECTURE.pdf');

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`);

  // Wait for Mermaid to finish rendering the SVG
  await page.waitForSelector('.mermaid svg', { timeout: 15000 });
  // Small extra pause to ensure all edges/labels are drawn
  await page.waitForTimeout(1500);

  await page.pdf({
    path: pdfPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
  });

  await browser.close();
  console.log(`PDF saved → ${pdfPath}`);
})();
