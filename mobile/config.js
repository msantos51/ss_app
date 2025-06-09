import Constants from 'expo-constants';

// Allow BASE_URL to be configured via environment variable or Expo config
const envUrl =
  process.env.BASE_URL ||
  process.env.EXPO_PUBLIC_BASE_URL ||
  Constants.expoConfig?.extra?.BASE_URL;

// Default to Android emulator loopback
export const BASE_URL = envUrl || 'http://10.0.2.2:8000';

