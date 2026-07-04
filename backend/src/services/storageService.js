const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

function ensureDirSync(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeSegment(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function resolveAbsolutePath(storagePath) {
  if (!storagePath) throw new Error('storagePath is required');
  if (path.isAbsolute(storagePath)) return storagePath;
  const relative = storagePath.replace(/^[/\\]+/, '');
  const absolute = path.join(UPLOADS_ROOT, relative);
  const normalizedRoot = path.resolve(UPLOADS_ROOT);
  const normalizedFile = path.resolve(absolute);
  if (!normalizedFile.startsWith(normalizedRoot)) {
    throw new Error('Invalid storage path');
  }
  return normalizedFile;
}

function buildQuotationPdfPath({ companyId, quotationId, version, fileName }) {
  const safeCompany = sanitizeSegment(companyId);
  const safeQuote = sanitizeSegment(quotationId);
  const safeName = sanitizeSegment(fileName || `v${version}.pdf`);
  const relative = path
    .join('companies', safeCompany, 'quotations', safeQuote, safeName)
    .replace(/\\/g, '/');
  return {
    relativePath: relative,
    absolutePath: path.join(UPLOADS_ROOT, relative),
  };
}

async function writeFile(storagePath, buffer) {
  const absolutePath = resolveAbsolutePath(storagePath);
  ensureDirSync(path.dirname(absolutePath));
  await fsp.writeFile(absolutePath, buffer);
  return {
    storagePath: storagePath.replace(/\\/g, '/'),
    absolutePath,
    fileSize: buffer.length,
  };
}

async function readFile(storagePath) {
  const absolutePath = resolveAbsolutePath(storagePath);
  return fsp.readFile(absolutePath);
}

async function deleteFile(storagePath) {
  if (!storagePath) return false;
  try {
    const absolutePath = resolveAbsolutePath(storagePath);
    await fsp.unlink(absolutePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

async function fileExists(storagePath) {
  try {
    const absolutePath = resolveAbsolutePath(storagePath);
    await fsp.access(absolutePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function hashString(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

module.exports = {
  UPLOADS_ROOT,
  ensureDirSync,
  resolveAbsolutePath,
  buildQuotationPdfPath,
  writeFile,
  readFile,
  deleteFile,
  fileExists,
  hashBuffer,
  hashString,
};
