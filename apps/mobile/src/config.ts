// The backend has no live instance reachable from this sandbox; this is the
// address the app targets once run against a real API server / emulator
// (10.0.2.2 is the Android emulator's alias for the host machine's localhost).
export const API_BASE_URL = 'http://10.0.2.2:3000';

export const REPORT_QUEUE_STORAGE_KEY = 'spectech.report_queue';
export const AUTH_TOKEN_STORAGE_KEY = 'spectech.auth_token';
