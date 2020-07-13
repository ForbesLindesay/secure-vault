import crypto from 'crypto';
import Opaque, {create} from 'ts-opaque';
import {SecretData, IV, Environment, Salt, Ciphertext} from '../types';
import {
  IV_LENGTH,
  SALT_LENGTH,
  KEY_LENGTH,
  DIGEST_HASH,
  CIPHER,
  AUTH_TAG_LENGTH,
} from '../constants';

/**
 * An encryption key derrived from a password. This must be kept private.
 */
type Pbkdf2Key = Opaque<Buffer, 'pbkdf2'>;

function getIV(): IV {
  return create<IV>(crypto.randomBytes(IV_LENGTH));
}

const ServerEnvironment: Environment<Pbkdf2Key> = {
  getSalt() {
    return create<Salt>(crypto.randomBytes(SALT_LENGTH));
  },
  async getKey(password, salt, {iterations}) {
    return await new Promise<Pbkdf2Key>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        KEY_LENGTH / 8,
        DIGEST_HASH.server,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(create<Pbkdf2Key>(derivedKey));
        },
      );
    });
  },
  async encrypt(key, message) {
    const iv = getIV();
    const cipher = (crypto as any).createCipheriv(CIPHER.server, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const ciphertext = create<Ciphertext>(
      Buffer.concat([
        cipher.update(message),
        cipher.final(),
        cipher.getAuthTag(),
      ]),
    );
    return {ciphertext, iv};
  },
  async decrypt(key, {iv, ciphertext}) {
    const cipher = (crypto as any).createDecipheriv(CIPHER.server, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    cipher.setAuthTag(
      ciphertext.slice(
        ciphertext.byteLength - AUTH_TAG_LENGTH,
        ciphertext.length,
      ),
    );
    return create<SecretData>(
      Buffer.concat([
        cipher.update(
          ciphertext.slice(0, ciphertext.byteLength - AUTH_TAG_LENGTH),
        ),
        cipher.final(),
      ]),
    );
  },
};
export default ServerEnvironment;
