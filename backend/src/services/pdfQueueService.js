const quotationPdfService = require('./quotationPdfService');

const queue = [];
const inflight = new Map();
let processing = false;

function jobKey(job) {
  return `${job.type}:${job.quotationId}:${job.companyId}`;
}

function enqueuePdfJob(job) {
  if (!job?.quotationId || !job?.companyId) return;

  const key = jobKey(job);
  // Coalesce duplicate generate jobs for the same quotation.
  if (inflight.has(key) || queue.some((item) => jobKey(item) === key)) {
    const existing = queue.find((item) => jobKey(item) === key);
    if (existing && job.force) existing.force = true;
    return;
  }

  queue.push({
    type: job.type || 'generate',
    quotationId: String(job.quotationId),
    companyId: String(job.companyId),
    userId: job.userId || null,
    force: Boolean(job.force),
    attempts: 0,
  });
  setImmediate(processPdfQueue);
}

async function processPdfQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    const key = jobKey(job);
    inflight.set(key, true);

    try {
      if (job.type === 'generate') {
        await quotationPdfService.generateAndStorePdf({
          quotationId: job.quotationId,
          companyId: job.companyId,
          userId: job.userId,
          force: job.force,
        });
      } else if (job.type === 'delete') {
        await quotationPdfService.syncPdfOnQuotationDelete({
          quotationId: job.quotationId,
          companyId: job.companyId,
        });
      }
    } catch (err) {
      job.attempts += 1;
      if (job.attempts < 3) {
        queue.push(job);
      } else {
        console.error(
          `[pdfQueue] Failed ${job.type} for quotation ${job.quotationId}:`,
          err.message || err
        );
      }
    } finally {
      inflight.delete(key);
    }
  }

  processing = false;
}

module.exports = {
  enqueuePdfJob,
  processPdfQueue,
};
