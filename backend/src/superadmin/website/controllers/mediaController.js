const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const WebsiteMedia = require('../models/WebsiteMedia');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');
const { baseDoc, applyAllowed } = require('../utils/formatters');
const { logWebsiteActivity } = require('../services/websiteActivityService');

const UPLOAD_ROOT = path.join(__dirname, '../../../../uploads/website');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatMedia(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(plain),
    filename: plain.filename,
    originalName: plain.originalName,
    url: plain.url,
    mimeType: plain.mimeType,
    size: plain.size,
    width: plain.width,
    height: plain.height,
    folder: plain.folder || 'root',
    alt: plain.alt || '',
    title: plain.title || '',
    caption: plain.caption || '',
    format: plain.format || '',
    webpUrl: plain.webpUrl || '',
    avifUrl: plain.avifUrl || '',
    tags: plain.tags || [],
  };
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

const listMedia = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 40, maxLimit: 100 });
  const filter = { deletedAt: null };
  if (req.query.folder) filter.folder = req.query.folder;
  if (req.query.q) {
    const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { originalName: regex },
      { alt: regex },
      { title: regex },
      { caption: regex },
      { tags: regex },
    ];
  }
  if (req.query.mimeType) filter.mimeType = new RegExp(`^${req.query.mimeType}`);

  const [items, total, folders] = await Promise.all([
    WebsiteMedia.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WebsiteMedia.countDocuments(filter),
    WebsiteMedia.distinct('folder', { deletedAt: null }),
  ]);

  res.json({
    ...paginatedResponse(items.map(formatMedia), { page, limit, total }),
    folders: folders.sort(),
  });
});

const getMedia = asyncHandler(async (req, res) => {
  const item = await WebsiteMedia.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!item) throw new ApiError(404, 'Media not found');
  res.json({ media: formatMedia(item) });
});

const uploadMedia = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : [req.body];
  if (!files.length) throw new ApiError(400, 'No files provided');

  const folder = (req.body.folder || files[0]?.folder || 'root').replace(/[^a-zA-Z0-9/_-]/g, '');
  const folderPath = path.join(UPLOAD_ROOT, folder === 'root' ? '' : folder);
  ensureDir(folderPath);

  const created = [];

  for (const file of files) {
    if (!file) continue;
    let buffer;
    let mimeType = file.mimeType || 'application/octet-stream';
    let originalName = file.originalName || file.filename || 'upload';

    if (file.dataUrl) {
      const parsed = parseDataUrl(file.dataUrl);
      if (!parsed) throw new ApiError(400, 'Invalid dataUrl');
      buffer = parsed.buffer;
      mimeType = parsed.mimeType;
    } else if (file.base64) {
      buffer = Buffer.from(file.base64, 'base64');
    } else if (file.url && !file.dataUrl) {
      // External URL reference (no binary upload)
      const item = await WebsiteMedia.create({
        filename: originalName,
        originalName,
        url: file.url,
        mimeType,
        size: file.size || 0,
        width: file.width || null,
        height: file.height || null,
        folder,
        alt: file.alt || '',
        title: file.title || originalName,
        caption: file.caption || '',
        format: path.extname(originalName).replace('.', '').toLowerCase(),
        tags: file.tags || [],
        uploadedBy: req.superAdmin?._id,
      });
      created.push(formatMedia(item));
      continue;
    } else {
      throw new ApiError(400, 'Provide dataUrl, base64, or url');
    }

    const ext = (path.extname(originalName) || `.${mimeType.split('/')[1] || 'bin'}`).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const absPath = path.join(folderPath, filename);
    fs.writeFileSync(absPath, buffer);

    const publicUrl = `/uploads/website/${folder === 'root' ? '' : `${folder}/`}${filename}`.replace(/\/+/g, '/');

    const item = await WebsiteMedia.create({
      filename,
      originalName,
      url: publicUrl,
      mimeType,
      size: buffer.length,
      width: file.width || null,
      height: file.height || null,
      folder,
      alt: file.alt || '',
      title: file.title || originalName,
      caption: file.caption || '',
      format: ext.replace('.', ''),
      webpUrl: '',
      avifUrl: file.avifReady ? publicUrl : '',
      tags: file.tags || [],
      uploadedBy: req.superAdmin?._id,
    });
    created.push(formatMedia(item));
  }

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'uploaded',
    resourceType: 'media',
    title: `Uploaded ${created.length} file(s)`,
    metadata: { count: created.length, folder },
    req,
  });

  res.status(201).json({ data: created });
});

const updateMedia = asyncHandler(async (req, res) => {
  const item = await WebsiteMedia.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Media not found');
  applyAllowed(item, req.body, ['alt', 'title', 'caption', 'folder', 'tags', 'webpUrl', 'avifUrl', 'width', 'height']);
  await item.save();
  res.json({ media: formatMedia(item) });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const item = await WebsiteMedia.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Media not found');
  item.deletedAt = new Date();
  await item.save();
  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'deleted',
    resourceType: 'media',
    resourceId: item._id,
    title: item.originalName || item.filename,
    req,
  });
  res.json({ message: 'Deleted' });
});

const bulkDeleteMedia = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) throw new ApiError(400, 'ids required');
  await WebsiteMedia.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );
  res.json({ message: 'Deleted', count: ids.length });
});

const createFolder = asyncHandler(async (req, res) => {
  const folder = String(req.body?.folder || '').trim().replace(/[^a-zA-Z0-9/_-]/g, '');
  if (!folder) throw new ApiError(400, 'folder required');
  ensureDir(path.join(UPLOAD_ROOT, folder));
  res.status(201).json({ folder });
});

module.exports = {
  listMedia,
  getMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
  bulkDeleteMedia,
  createFolder,
  formatMedia,
};
