const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const streamifier = require('stream');

/**
 * Upload a file Buffer directly to Cloudinary via upload_stream
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {Object} options - Cloudinary upload options (folder, public_id, transformation, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your backend/.env file.'
        )
      );
    }

    const defaultOptions = {
      folder: 'chakki_smart_ai',
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // Create readable stream from buffer and pipe to Cloudinary
    const bufferStream = new streamifier.Readable();
    bufferStream.push(buffer);
    bufferStream.push(null); // End of stream
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Delete a resource from Cloudinary by public ID
 * @param {string} publicId - The public ID of the resource
 * @param {string} resourceType - 'image', 'raw', 'video'
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured in backend/.env');
  }

  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

/**
 * Generate an optimized URL for an existing Cloudinary public ID
 * @param {string} publicId 
 * @param {Object} transformations 
 * @returns {string}
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations,
  });
};

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  isCloudinaryConfigured,
};

