/**
 * Live Production Backend on Render
 * https://smart-kisan-66tu.onrender.com/api/v1
 */
export const PRODUCTION_API_URL = 'https://smart-kisan-66tu.onrender.com/api/v1';

/**
 * Resolves the active Backend API URL
 * Defaults to live production Render server so the app works seamlessly
 * on physical phones (Expo Go & standalone APK), emulator and web.
 */
export const getBaseApiUrl = () => {
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getBaseApiUrl();
export default API_BASE_URL;


