import Opaque, {create} from 'ts-opaque';
import {Environment, IV, Salt, Ciphertext} from './types';
import {SecretData} from '../utils/types';
import {
  IV_LENGTH,
  SALT_LENGTH,
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  DIGEST_HASH,
  CIPHER,
} from '../utils/constants';

// tslint:disable-next-line: strict-type-predicates
if (typeof window === 'undefined') {
  throw new Error(
    'To use secure-vault in node.js you must have at least version 14',
  );
}

/**
 * An encryption key derrived from a password. This must be kept private.
 */
type Pbkdf2Key = Opaque<CryptoKey, 'pbkdf2'>;

function getIV(): IV {
  return create<IV>(crypto.getRandomValues(new Uint8Array(IV_LENGTH)));
}

const BrowserEnvironment: Environment<Pbkdf2Key> = {
  getSalt() {
    return create<Salt>(crypto.getRandomValues(new Uint8Array(SALT_LENGTH)));
  },

  async getKey(password, salt): Promise<Pbkdf2Key> {
    const keyMaterial = await Promise.resolve(
      crypto.subtle.importKey('raw', password, {name: 'PBKDF2'}, false, [
        'deriveBits',
        'deriveKey',
      ]),
    );

    const key = await Promise.resolve(
      crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          hash: DIGEST_HASH.browser,
        },
        keyMaterial,
        {name: CIPHER.browser, length: KEY_LENGTH},
        true,
        ['encrypt', 'decrypt'],
      ),
    );

    return create<Pbkdf2Key>(key);
  },

  async encrypt(key, message) {
    const iv = getIV();

    const ciphertext = new Uint8Array(
      await Promise.resolve(
        crypto.subtle.encrypt(
          {
            name: CIPHER.browser,
            iv,
          },
          key,
          message,
        ),
      ),
    );
    return {ciphertext: create<Ciphertext>(ciphertext), iv};
  },

  async decrypt(key, {iv, ciphertext}) {
    const secretData = await Promise.resolve(
      crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        ciphertext,
      ),
    );

    return create<SecretData>(new Uint8Array(secretData));
  },
};

export default BrowserEnvironment;
