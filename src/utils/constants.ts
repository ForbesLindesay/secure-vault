// TODO: is it better to have a longer salt, or is 16 bytes optimal?
// TODO: is a longer IV better, or is 12 bytes optimal.

export const VERSION = 1;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;
export const PBKDF2_ITERATIONS = 200_000;
export const DIGEST_HASH = {browser: 'SHA-256', server: 'sha256'} as const;

export const KEY_LENGTH = 256;
export const CIPHER = {
  browser: 'AES-GCM',
  server: `aes-${KEY_LENGTH}-gcm`,
} as const;

export const AUTH_TAG_LENGTH = 16;
