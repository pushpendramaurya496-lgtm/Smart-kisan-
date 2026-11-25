const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadSingle, uploadMultiple, deleteImage, checkStatus } = require('./upload.controller');
const { uploadSingle: multerSingle, uploadMultiple: multerMultiple } = require('../../middleware/upload.middleware');

// Multer instance for single file accepting either 'file' or 'image'
const storage = multer.memoryStorage();
const uploadAnySingle = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

// Middleware to handle both 'file' and 'image' field names smoothly
const flexibleSingleUpload = (req, res, next) => {
  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      } else if (req.files.image && req.files.image[0]) {
        req.file = req.files.image[0];
      }
    }
    next();
  });
};

// Routes
// 1. Status check
router.get('/status', checkStatus);

// 2. Single image/document upload
router.post('/single', flexibleSingleUpload, uploadSingle);
router.post('/', flexibleSingleUpload, uploadSingle); // Alias for convenience

// 3. Multiple images/documents upload
router.post('/multiple', multerMultiple('files', 10), uploadMultiple);

// 4. Delete image by public_id
router.delete('/', deleteImage);

module.exports = router;

