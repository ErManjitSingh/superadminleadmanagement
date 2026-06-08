/**
 * Opens quotation HTML in a dedicated print window so PDF/print
 * is not affected by the CRM shell (sidebar, visibility hacks, etc.).
 */
export function printQuotation(contentEl, title = 'Quotation') {
  if (!contentEl) {
    window.print();
    return;
  }

  const printWin = window.open('', '_blank', 'noopener,noreferrer,width=920,height=720');
  if (!printWin) {
    window.print();
    return;
  }

  const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => link.outerHTML)
    .join('\n');

  const safeTitle = String(title || 'Quotation').replace(/[<>&"]/g, '');

  printWin.document.open();
  printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  ${stylesheets}
  <style>
    @page { margin: 10mm; size: A4 portrait; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    img { max-width: 100%; }
  </style>
</head>
<body>
  ${contentEl.outerHTML}
</body>
</html>`);
  printWin.document.close();

  const runPrint = () => {
    try {
      printWin.focus();
      printWin.print();
    } catch {
      /* ignore */
    }
  };

  printWin.onload = () => setTimeout(runPrint, 500);
  setTimeout(runPrint, 1500);
}
