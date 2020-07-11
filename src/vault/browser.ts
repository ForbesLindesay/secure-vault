import Opaque, {create} from 'ts-opaque';
import {
  Password,
  UnlockedVault,
  LockedVault,
  SecretData,
  EncryptedData,
  SecureVault,
  secretData,
} from '../utils/types';
import {
  VERSION,
  IV_LENGTH,
  SALT_LENGTH,
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  DIGEST_HASH,
  CIPHER,
} from '../utils/constants';

/**
 * An encryption key derrived from a password. This must be kept private.
 */
type Pbkdf2Key = Opaque<CryptoKey, 'pbkdf2'>;

/**
 * The Salt must be unique for every password and must be at least
 * 16 bytes long.
 * It does not need to be kept private.
 */
type Salt = Opaque<Uint8Array, 'salt'>;

/**
 * The IV must be unique for every encryption operation carried out using
 * the same key and should be at least 12 bytes long.
 * It does not need to be kept private.
 */
type IV = Opaque<Uint8Array, 'iv'>;

export default function secureVault(crypto: typeof window.crypto): SecureVault {
  function getIV(): IV {
    return create<IV>(crypto.getRandomValues(new Uint8Array(IV_LENGTH)));
  }

  async function getKey(password: Password, salt: Salt): Promise<Pbkdf2Key> {
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
  }

  async function encrypt(
    key: Pbkdf2Key,
    message: SecretData,
  ): Promise<EncryptedData> {
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
    const c = new Uint8Array(1 + iv.length + ciphertext.length);
    c[0] = VERSION;
    c.set(iv, 1);
    c.set(ciphertext, 1 + iv.length);
    return create<EncryptedData>(c);
  }

  async function decrypt(
    key: Pbkdf2Key,
    encryptedData: EncryptedData,
  ): Promise<SecretData> {
    const version = encryptedData[0];
    if (version !== VERSION) {
      throw new Error('Unsupported EncryptedData version');
    }
    const iv = encryptedData.slice(1, 1 + IV_LENGTH);
    const ciphertext = encryptedData.slice(1 + IV_LENGTH);
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
  }

  function getSalt(): Salt {
    return create<Salt>(crypto.getRandomValues(new Uint8Array(SALT_LENGTH)));
  }

  function unlockedVault(
    key: Pbkdf2Key,
    lockedVault: LockedVault,
  ): UnlockedVault {
    return {
      async encrypt(secretData: SecretData) {
        return encrypt(key, secretData);
      },
      async decrypt(encryptedData: EncryptedData) {
        return decrypt(key, encryptedData);
      },
      lock: () => lockedVault,
    };
  }

  async function createVault(password: Password): Promise<UnlockedVault> {
    const salt = getSalt();
    const key = await getKey(password, salt);
    const signature = await encrypt(
      key,
      secretData(crypto.getRandomValues(new Uint8Array(32))),
    );
    const lockedVault = create<LockedVault>(
      new Uint8Array(1 + salt.length + signature.length),
    );
    lockedVault[0] = VERSION;
    lockedVault.set(salt, 1);
    lockedVault.set(signature, 1 + salt.length);
    return unlockedVault(key, lockedVault);
  }

  async function unlockVault(
    lockedVault: LockedVault,
    password: Password,
  ): Promise<UnlockedVault> {
    const version = lockedVault[0];
    if (version !== VERSION) {
      throw new Error('This locked vault has an unsupported version');
    }
    const salt = create<Salt>(lockedVault.slice(1, 1 + SALT_LENGTH));
    const signature = create<EncryptedData>(lockedVault.slice(1 + SALT_LENGTH));
    const key = await getKey(password, salt);
    await decrypt(key, signature);
    return unlockedVault(key, lockedVault);
  }

  return {
    createVault,
    unlockVault,
  };
}
