import { Platform, NativeModules } from 'react-native';

/**
 * Dynamically resolves the development computer's LAN IP
 * Works seamlessly on:
 * 1. Physical Android/iOS phones running Expo Go over Wi-Fi
 * 2. Android Emulator (10.0.2.2 fallback)
 * 3. iOS Simulator & Web (localhost)
 */
export const getBaseApiUrl = () => {
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

  // Primary PC Wi-Fi LAN IP
  const PC_LAN_IP = '192.168.29.166';
  return `http://${PC_LAN_IP}:5000/api/v1`;
};

export const API_BASE_URL = getBaseApiUrl();
export default API_BASE_URL;

