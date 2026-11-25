import { API_BASE_URL } from './apiConfig';

/**
 * Cloudinary & Image Upload Service for React Native / Expo
 * Allows uploading images via backend (/api/v1/upload) or directly to Cloudinary.
 */
export const CloudinaryService = {
  /**
   * Upload an image to Cloudinary via the Node.js backend
   * @param {string} imageUri - Local URI from expo-image-picker (e.g., file:///...)
   * @param {Object} options - Options { folder: 'profiles' | 'bills' | 'tokens' }
   * @returns {Promise<{ success: boolean, url: string, public_id?: string, error?: string }>}
   */
  async uploadImage(imageUri, options = { folder: 'profiles' }) {
    if (!imageUri) {
      return { success: false, error: 'No image URI provided' };
    }

    try {
      // 1. Prepare filename and MIME type
      const filename = imageUri.split('/').pop() || `img_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      // 2. Build multipart/form-data
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      });

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      // 3. Post to backend upload endpoint
      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          // Note: Content-Type is left unset so fetch sets multipart/form-data boundary automatically
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        return {
          success: true,
          url: data.data.secure_url || data.data.url,
          public_id: data.data.public_id,
          format: data.data.format,
          bytes: data.data.bytes,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to upload image to Cloudinary',
          fallbackUrl: imageUri,
        };
      }
    } catch (error) {
      console.warn('Backend Cloudinary upload failed, using local URI fallback:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackUrl: imageUri,
      };
    }
  },

  /**
   * Direct Unsigned Upload to Cloudinary API (without backend proxy)
   * Use this if you have created an "Unsigned Upload Preset" in Cloudinary Console
   * @param {string} imageUri 
   * @param {string} cloudName 
   * @param {string} uploadPreset 
   * @returns {Promise<{ success: boolean, url: string }>}
   */
  async uploadDirectToCloudinary(imageUri, cloudName, uploadPreset) {
    try {
      const filename = imageUri.split('/').pop() || `img_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      });
      formData.append('upload_preset', uploadPreset);

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.secure_url) {
        return {
          success: true,
          url: json.secure_url,
          public_id: json.public_id,
        };
      } else {
        return {
          success: false,
          error: json.error?.message || 'Direct Cloudinary upload failed',
          fallbackUrl: imageUri,
        };
      }
    } catch (e) {
      console.warn('Direct Cloudinary upload failed:', e.message);
      return { success: false, error: e.message, fallbackUrl: imageUri };
    }
  },

  /**
   * Check status of Cloudinary configuration on backend
   */
  async checkBackendStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/upload/status`);
      return await res.json();
    } catch (e) {
      return { success: false, configured: false, error: e.message };
    }
  },
};

export default CloudinaryService;

