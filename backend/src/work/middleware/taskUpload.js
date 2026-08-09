const path = require('path');
const multer = require('multer');
const ApiError = require('../../utils/apiError');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const allowedExtensions = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.csv', '.zip',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 5,
    fields: 10,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(new ApiError(400, 'Unsupported file type'));
    }
    callback(null, true);
  },
});

function uploadTaskFiles(req, res, next) {
  upload.array('files', 5)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return next(new ApiError(413, 'Each file must be 25 MB or smaller'));
      if (error.code === 'LIMIT_FILE_COUNT') return next(new ApiError(400, 'Upload at most 5 files at once'));
      return next(new ApiError(400, error.message));
    }
    next(error);
  });
}

module.exports = { uploadTaskFiles };
