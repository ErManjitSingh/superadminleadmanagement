const fs = require('fs');
const path = require('path');

let puppeteerModule = null;

function loadPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = require('puppeteer');
  }
  return puppeteerModule;
}

async function renderVoucherHtmlToPdf(html, fileName, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);

  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }));
    });
    await page.emulateMediaType('print');
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
  } finally {
    await browser.close();
  }

  const stats = fs.statSync(filePath);
  const sub = path.basename(outputDir);
  return {
    filePath,
    fileName,
    fileSize: stats.size,
    pdfUrl: `/uploads/${sub}/${fileName}`,
  };
}

module.exports = {
  renderVoucherHtmlToPdf,
};
