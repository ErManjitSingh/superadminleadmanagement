export function renderEmailTemplate(text, lead = {}, extras = {}) {
  const amount = extras.amount ?? lead.budget;
  const formattedAmount =
    amount != null && amount !== ''
      ? `₹${Number(amount).toLocaleString('en-IN')}`
      : '';

  const travelDate = lead.travelDate
    ? new Date(lead.travelDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const vars = {
    customerName: lead.name || 'Customer',
    destination: lead.destination || 'your destination',
    quotationNumber: extras.quotationNumber || extras.quoteNumber || '',
    amount: formattedAmount,
    travelDate,
    executiveName: extras.executiveName || 'UNO Trips',
  };

  return String(text || '').replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || '').split(',')[1] || '';
      resolve({
        filename: file.name,
        content: base64,
        encoding: 'base64',
        contentType: file.type || 'application/octet-stream',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function filesToAttachments(files) {
  const list = Array.from(files || []);
  return Promise.all(list.map(fileToAttachment));
}

export function buildQuotationHtmlAttachment(quote) {
  if (!quote) return null;
  const lines = [
    `<h2>Quotation ${quote.quoteNumber || ''}</h2>`,
    `<p><strong>Customer:</strong> ${quote.lead?.name || quote.customerName || ''}</p>`,
    `<p><strong>Destination:</strong> ${quote.destination || quote.lead?.destination || ''}</p>`,
    `<p><strong>Amount:</strong> ₹${Number(quote.totalAmount || quote.grandTotal || 0).toLocaleString('en-IN')}</p>`,
    `<p><strong>Travel date:</strong> ${quote.travelDate ? new Date(quote.travelDate).toLocaleDateString('en-IN') : '—'}</p>`,
    '<p>Please contact us for the full itinerary and inclusions.</p>',
    '<p>— UNO Trips Sales Team</p>',
  ];
  const html = `<!DOCTYPE html><html><body>${lines.join('')}</body></html>`;
  const content = btoa(unescape(encodeURIComponent(html)));
  return {
    filename: `Quotation-${quote.quoteNumber || 'UNO'}.html`,
    content,
    encoding: 'base64',
    contentType: 'text/html',
  };
}
