const fs = require('fs');
const path = require('path');

let puppeteerModule = null;
let browserPromise = null;
let idleTimer = null;
const BROWSER_IDLE_MS = 5 * 60 * 1000;
const IMAGE_WAIT_MS = 3000;

function loadPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = require('puppeteer');
  }
  return puppeteerModule;
}

function scheduleBrowserClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (!browserPromise) return;
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch {
      // ignore
    }
    browserPromise = null;
    idleTimer = null;
  }, BROWSER_IDLE_MS);
}

async function getBrowser() {
  if (idleTimer) clearTimeout(idleTimer);
  if (!browserPromise) {
    const puppeteer = loadPuppeteer();
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-extensions',
        '--disable-background-networking',
      ],
    }).catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

async function renderHtmlToPdfPage(page, html) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    if (['media', 'websocket', 'manifest', 'other'].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });

  await Promise.race([
    page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }));
    }),
    new Promise((resolve) => { setTimeout(resolve, IMAGE_WAIT_MS); }),
  ]);

  await page.emulateMediaType('print');
  return page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
}

async function renderVoucherHtmlToPdf(html, fileName, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const pdfBuffer = await renderHtmlToPdfPage(page, html);
    fs.writeFileSync(filePath, pdfBuffer);
  } finally {
    await page.close().catch(() => {});
    scheduleBrowserClose();
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

/** Render to buffer only (no disk) — used for fast repair preview paths if needed later */
async function renderVoucherHtmlToBuffer(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    return await renderHtmlToPdfPage(page, html);
  } finally {
    await page.close().catch(() => {});
    scheduleBrowserClose();
  }
}

async function closeBrowser() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // ignore
  }
  browserPromise = null;
}

process.once('SIGTERM', () => { closeBrowser().catch(() => {}); });
process.once('SIGINT', () => { closeBrowser().catch(() => {}); });

module.exports = {
  renderVoucherHtmlToPdf,
  renderVoucherHtmlToBuffer,
  closeBrowser,
};
