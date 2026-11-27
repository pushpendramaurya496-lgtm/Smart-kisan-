import { Platform, NativeModules } from 'react-native';

/**
 * Live Production Backend on Render (Ready for final APK deployment)
 */
export const PRODUCTION_API_URL = 'https://smart-kisan-66tu.onrender.com/api/v1';

/**
 * Development Mode:
 * true  -> Local development mode (instant changes, no GitHub push required, tests Fast2SMS directly)
 * false -> Production live Render backend
 */
export const IS_LOCAL_DEV = true;

/**
 * Resolves the active Backend API URL
 */
export const getBaseApiUrl = () => {
  if (!IS_LOCAL_DEV) {
    return PRODUCTION_API_URL;
  }

  // 1. Web browser
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:5000/api/v1`;
    }
    return 'http://localhost:5000/api/v1';
  }

  // 2. Physical device or emulator via Expo Metro
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0];
      const host = address?.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:5000/api/v1`;
      }
    }
  } catch (e) {
    // fallback below
  }

  // 3. Primary PC Wi-Fi LAN IP (active host)
  const PC_LAN_IP = '192.168.29.166';
  return `http://${PC_LAN_IP}:5000/api/v1`;
};

export const API_BASE_URL = getBaseApiUrl();
export default API_BASE_URL;


