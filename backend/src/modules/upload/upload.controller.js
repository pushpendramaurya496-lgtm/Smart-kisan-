const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured,
} = require('../../services/cloudinary.service');

/**
 * Single File Upload Controller
 * POST /api/v1/upload
 * Supports fields: 'file' or 'image'
 */
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please send a file in form-data field "file" or "image".',
      });
    }

    // Optional folder from query or body (e.g., 'profiles', 'bills', 'tokens')
    const subFolder = req.body.folder || req.query.folder || 'general';
    const folder = `chakki_smart_ai/${subFolder}`;

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder,
      resource_type: 'auto',
    });

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully to Cloudinary!',
      data: {
        url: result.secure_url || result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        original_name: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Multiple Files Upload Controller
 * POST /api/v1/upload/multiple
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded. Please send files in form-data field "files".',
      });
    }

    const subFolder = req.body.folder || req.query.folder || 'general';
    const folder = `chakki_smart_ai/${subFolder}`;

    const uploadPromises = req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, {
        folder,
        resource_type: 'auto',
      }).then((result) => ({
        url: result.secure_url || result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        original_name: file.originalname,
      }))
    );

    const uploadedFiles = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully to Cloudinary!`,
      data: uploadedFiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete File Controller
 * DELETE /api/v1/upload
 */
const deleteImage = async (req, res, next) => {
  try {
    const { public_id, resource_type = 'image' } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'public_id is required in request body to delete an image.',
      });
    }

    const result = await deleteFromCloudinary(public_id, resource_type);

    return res.status(200).json({
      success: true,
      message: 'Resource deleted from Cloudinary successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check Cloudinary Status
 * GET /api/v1/upload/status
 */
const checkStatus = (req, res) => {
  const configured = isCloudinaryConfigured();
  return res.status(200).json({
    success: true,
    configured,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME
      ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***`
      : 'Not Set',
    message: configured
      ? 'Cloudinary is configured and ready to use!'
      : 'Cloudinary credentials are not set. Please update backend/.env with CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteImage,
  checkStatus,
};

