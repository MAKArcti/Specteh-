import { Platform } from 'react-native';

// 10.0.2.2 is the Android emulator's alias for the host machine's localhost
// (the real target platform here); the browser has no such alias, so
// `expo start --web` needs a plain localhost to reach a locally running API.
export const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

export const REPORT_QUEUE_STORAGE_KEY = 'spectech.report_queue';
export const WORK_TIMER_STORAGE_KEY = 'spectech.work_timer';
export const AUTH_TOKEN_STORAGE_KEY = 'spectech.auth_token';
