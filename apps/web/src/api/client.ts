const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new ApiError(response.status, extractMessage(body, response.statusText));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
