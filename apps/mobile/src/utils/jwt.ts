import type { UserRole } from '@spectech/shared-types';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  roles: UserRole[];
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Hermes (React Native's JS engine) doesn't reliably ship a global atob, so
 * this decodes base64 by hand rather than adding a dependency for one
 * function.
 */
function base64Decode(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/**
 * Deviation from the literal spec text ("you never decode it since the app
 * just uses the opaque token"): there is no GET /users/me endpoint on the
 * backend, and login only returns { accessToken }, so `roles` (needed to
 * decide which tabs to show) and the user id have no other source after a
 * plain phone+password login. This reads the payload only — it never
 * verifies the signature, and the app never trusts it for anything the
 * server itself doesn't independently enforce via its own auth guards.
 */
export function decodeJwtPayload(token: string): JwtPayload {
  const segments = token.split('.');
  if (segments.length < 2) {
    throw new Error('Malformed token');
  }
  const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = base64Decode(base64);
  return JSON.parse(json) as JwtPayload;
}
