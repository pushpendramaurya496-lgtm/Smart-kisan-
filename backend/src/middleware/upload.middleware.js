const multer = require('multer');

// Memory storage keeps file in memory as Buffer for direct streaming to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file format (${file.mimetype}). Allowed types: JPG, PNG, WEBP, GIF, PDF`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
  },
  fileFilter,
});

module.exports = {
  uploadSingle: (fieldName = 'file') => upload.single(fieldName),
  uploadMultiple: (fieldName = 'files', maxCount = 5) => upload.array(fieldName, maxCount),
  uploadFields: (fields) => upload.fields(fields),
};
