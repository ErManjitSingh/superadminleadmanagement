const Payment = require('../models/Payment');

/**
 * Next unique INV-{year}-{####} by scanning the highest existing sequence.
 * Uses skipTenantFilter because invoiceNumber has a collection-wide unique index.
 */
async function nextPaymentInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const re = new RegExp(`^INV-${year}-(\\d+)$`);

  const docs = await Payment.find({ invoiceNumber: { $regex: `^INV-${year}-` } })
    .select('invoiceNumber')
    .setOptions({ skipTenantFilter: true })
    .lean();

  let max = 0;
  for (const doc of docs) {
    const match = String(doc.invoiceNumber || '').match(re);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }

  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

/**
 * Create a Payment with a fresh invoice number. Retries on rare duplicate-key races.
 */
async function createPaymentWithInvoice(payload, { maxAttempts = 5 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const invoiceNumber = await nextPaymentInvoiceNumber();
    try {
      return await Payment.create({ ...payload, invoiceNumber });
    } catch (err) {
      const isDup =
        err?.code === 11000 &&
        (String(err?.message || '').includes('invoiceNumber') || err?.keyPattern?.invoiceNumber);
      if (!isDup) throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Could not allocate a unique invoice number');
}

module.exports = { nextPaymentInvoiceNumber, createPaymentWithInvoice };
