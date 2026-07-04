const Quotation = require('../models/Quotation');
const QuotationFile = require('../models/QuotationFile');
const Company = require('../superadmin/models/Company');
const ApiError = require('../utils/apiError');
const storageService = require('./storageService');
const {
  generateQuotationPdfBuffer,
  buildContentHashPayload,
} = require('./quotationPdfGenerator');

const MAX_RETRIES = 3;

async function loadQuotationForCompany(quotationId, companyId) {
  if (!companyId) throw new ApiError(403, 'Company context is required');

  const quotation = await Quotation.findById(quotationId).populate('lead package');
  if (!quotation) throw new ApiError(404, 'Quotation not found');

  if (quotation.companyId && String(quotation.companyId) !== String(companyId)) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (!quotation.companyId) {
    quotation.companyId = companyId;
  }

  return quotation;
}

async function getActiveFile(quotationId, companyId) {
  return QuotationFile.findOne({
    quotationId,
    companyId,
    isActive: true,
    deletedAt: null,
  });
}

async function deactivateAndDeleteFile(fileDoc) {
  if (!fileDoc) return;
  if (fileDoc.storagePath) {
    await storageService.deleteFile(fileDoc.storagePath).catch(() => {});
  }
  fileDoc.isActive = false;
  fileDoc.deletedAt = new Date();
  await fileDoc.save();
}

async function deleteAllFilesForQuotation(quotationId, companyId) {
  const files = await QuotationFile.find({
    quotationId,
    companyId,
    deletedAt: null,
  });
  for (const file of files) {
    await deactivateAndDeleteFile(file);
  }
  await QuotationFile.deleteMany({
    quotationId,
    companyId,
  });
}

function buildFileName(quotation, version) {
  const safeNumber = String(quotation.quoteNumber || quotation._id).replace(/[^\w.-]+/g, '_');
  return `${safeNumber}_v${version}.pdf`;
}

/**
 * Generate (or refresh) the permanent PDF for a quotation.
 * Only one active PDF is kept. Version increments on each regeneration.
 */
async function generateAndStorePdf({
  quotationId,
  companyId,
  userId = null,
  force = false,
  attempt = 1,
}) {
  if (!companyId) throw new ApiError(403, 'Company context is required');

  const quotation = await loadQuotationForCompany(quotationId, companyId);
  const company = await Company.findById(companyId).lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const lead = quotation.lead && typeof quotation.lead === 'object' ? quotation.lead : {};
  const contentHash = storageService.hashString(buildContentHashPayload(quotation, company));
  const activeFile = await getActiveFile(quotationId, companyId);

  if (!force && activeFile && activeFile.contentHash === contentHash) {
    const exists = await storageService.fileExists(activeFile.storagePath);
    if (exists) {
      quotation.pdfFileId = activeFile._id;
      quotation.pdfVersion = activeFile.version;
      quotation.pdfStatus = 'ready';
      quotation.pdfContentHash = contentHash;
      quotation.pdfError = '';
      quotation.pdfUrl = '';
      await quotation.save();
      return {
        skipped: true,
        file: activeFile,
        quotation,
      };
    }
  }

  quotation.pdfStatus = 'generating';
  quotation.pdfError = '';
  await quotation.save();

  let buffer;
  try {
    buffer = await generateQuotationPdfBuffer({ quotation, lead, company });
    if (!buffer?.length) throw new Error('PDF generator returned an empty file');
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      return generateAndStorePdf({
        quotationId,
        companyId,
        userId,
        force,
        attempt: attempt + 1,
      });
    }
    quotation.pdfStatus = 'failed';
    quotation.pdfError = err.message || 'PDF generation failed';
    await quotation.save();
    throw new ApiError(500, `PDF generation failed: ${err.message || 'unknown error'}`);
  }

  const nextVersion = activeFile ? activeFile.version + 1 : 1;
  const originalFileName = buildFileName(quotation, nextVersion);
  const { relativePath } = storageService.buildQuotationPdfPath({
    companyId,
    quotationId,
    version: nextVersion,
    fileName: originalFileName,
  });

  let stored;
  try {
    stored = await storageService.writeFile(relativePath, buffer);
  } catch (err) {
    quotation.pdfStatus = 'failed';
    quotation.pdfError = err.message || 'PDF storage failed';
    await quotation.save();
    throw new ApiError(500, `PDF storage failed: ${err.message || 'unknown error'}`);
  }

  // Soft-deactivate previous active file (keep bytes until metadata commit succeeds).
  if (activeFile) {
    activeFile.isActive = false;
    activeFile.deletedAt = new Date();
    await activeFile.save();
  }

  let fileDoc;
  try {
    fileDoc = await QuotationFile.create({
      quotationId: quotation._id,
      companyId,
      leadId: lead._id || quotation.lead || null,
      customerId: lead._id || quotation.lead || null,
      fileName: originalFileName,
      originalFileName,
      mimeType: 'application/pdf',
      fileSize: stored.fileSize,
      storagePath: stored.storagePath,
      version: nextVersion,
      contentHash,
      createdBy: userId,
      isActive: true,
      deletedAt: null,
    });
  } catch (err) {
    await storageService.deleteFile(stored.storagePath).catch(() => {});
    if (activeFile) {
      activeFile.isActive = true;
      activeFile.deletedAt = null;
      await activeFile.save().catch(() => {});
    }
    quotation.pdfStatus = 'failed';
    quotation.pdfError = err.message || 'Failed to save PDF metadata';
    await quotation.save();
    throw new ApiError(500, `Failed to save PDF metadata: ${err.message || 'unknown error'}`);
  }

  if (activeFile?.storagePath) {
    await storageService.deleteFile(activeFile.storagePath).catch(() => {});
  }

  quotation.pdfFileId = fileDoc._id;
  quotation.pdfVersion = nextVersion;
  quotation.pdfStatus = 'ready';
  quotation.pdfContentHash = contentHash;
  quotation.pdfError = '';
  quotation.pdfUrl = '';
  quotation.timeline = [
    ...(quotation.timeline || []),
    {
      type: 'pdf_generated',
      date: new Date(),
      user: 'System',
      notes: `Quotation PDF v${nextVersion} generated`,
    },
  ];
  await quotation.save();

  return {
    skipped: false,
    file: fileDoc,
    quotation,
  };
}

async function ensurePdfReady({ quotationId, companyId, userId = null, force = false }) {
  const quotation = await loadQuotationForCompany(quotationId, companyId);
  if (!force && quotation.pdfStatus === 'ready' && quotation.pdfFileId) {
    const activeFile = await getActiveFile(quotationId, companyId);
    if (activeFile) {
      const exists = await storageService.fileExists(activeFile.storagePath);
      if (exists) {
        const company = await Company.findById(companyId).lean();
        const contentHash = storageService.hashString(
          buildContentHashPayload(quotation, company || {})
        );
        if (activeFile.contentHash === contentHash) {
          return { file: activeFile, quotation, skipped: true };
        }
      }
    }
  }
  return generateAndStorePdf({ quotationId, companyId, userId, force });
}

async function getPdfBuffer({ quotationId, companyId }) {
  const result = await ensurePdfReady({ quotationId, companyId });
  const buffer = await storageService.readFile(result.file.storagePath);
  return {
    buffer,
    file: result.file,
    quotation: result.quotation,
  };
}

async function getPdfMetadata({ quotationId, companyId }) {
  const quotation = await loadQuotationForCompany(quotationId, companyId);
  const file = await getActiveFile(quotationId, companyId);
  return {
    quotationId: quotation._id,
    quoteNumber: quotation.quoteNumber,
    pdfStatus: quotation.pdfStatus || 'none',
    pdfVersion: quotation.pdfVersion || file?.version || 0,
    pdfError: quotation.pdfError || '',
    pdfFileId: quotation.pdfFileId || file?._id || null,
    file: file
      ? {
          id: file._id,
          fileName: file.fileName,
          originalFileName: file.originalFileName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          version: file.version,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          isActive: file.isActive,
        }
      : null,
  };
}

async function deleteQuotationPdf({ quotationId, companyId }) {
  const quotation = await loadQuotationForCompany(quotationId, companyId);
  await deleteAllFilesForQuotation(quotationId, companyId);
  if (quotation) {
    quotation.pdfFileId = undefined;
    quotation.pdfVersion = 0;
    quotation.pdfStatus = 'none';
    quotation.pdfContentHash = '';
    quotation.pdfError = '';
    quotation.pdfUrl = '';
    quotation.timeline = [
      ...(quotation.timeline || []),
      {
        type: 'pdf_deleted',
        date: new Date(),
        user: 'System',
        notes: 'Quotation PDF deleted',
      },
    ];
    await quotation.save();
  }
  return { deleted: true };
}

async function syncPdfOnQuotationChange({ quotationId, companyId, userId = null, force = false }) {
  const { enqueuePdfJob } = require('./pdfQueueService');
  enqueuePdfJob({
    type: 'generate',
    quotationId: String(quotationId),
    companyId: String(companyId),
    userId: userId ? String(userId) : null,
    force: Boolean(force),
  });
}

/** Mark quotation PDF pending and enqueue background generation. */
async function markPendingAndQueue({ quotationId, companyId, userId = null, force = false }) {
  if (!quotationId || !companyId) return;
  await Quotation.updateOne(
    { _id: quotationId },
    { $set: { pdfStatus: 'pending', pdfError: '' } }
  );
  syncPdfOnQuotationChange({ quotationId, companyId, userId, force });
}

async function syncPdfOnQuotationDelete({ quotationId, companyId }) {
  await deleteAllFilesForQuotation(quotationId, companyId);
}

module.exports = {
  generateAndStorePdf,
  ensurePdfReady,
  getPdfBuffer,
  getPdfMetadata,
  deleteQuotationPdf,
  syncPdfOnQuotationChange,
  syncPdfOnQuotationDelete,
  markPendingAndQueue,
  getActiveFile,
  loadQuotationForCompany,
};
