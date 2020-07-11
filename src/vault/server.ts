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
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  DIGEST_HASH,
  CIPHER,
  AUTH_TAG_LENGTH,
} from '../utils/constants';

/**
 * An encryption key derrived from a password. This must be kept private.
 */
type Pbkdf2Key = Opaque<Buffer, 'pbkdf2'>;

/**
 * The Salt must be unique for every password and must be at least
 * 16 bytes long.
 * It does not need to be kept private.
 */
type Salt = Opaque<Buffer, 'salt'>;

/**
 * The IV must be unique for every encryption operation carried out using
 * the same key and should be at least 12 bytes long.
 * It does not need to be kept private.
 */
type IV = Opaque<Buffer, 'iv'>;

export default function secureVault(
  crypto: typeof import('crypto'),
): SecureVault {
  function getIV(): IV {
    return create<IV>(crypto.randomBytes(IV_LENGTH));
  }

  async function getKey(password: Password, salt: Salt): Promise<Pbkdf2Key> {
    return await new Promise<Pbkdf2Key>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH / 8,
        DIGEST_HASH.server,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(create<Pbkdf2Key>(derivedKey));
        },
      );
    });
  }

  async function encrypt(
    key: Pbkdf2Key,
    message: SecretData,
  ): Promise<EncryptedData> {
    const iv = getIV();
    const cipher = (crypto as any).createCipheriv(CIPHER.server, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const ciphertext = Buffer.concat([
      cipher.update(message),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
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
    const iv = Buffer.from(encryptedData.slice(1, 1 + IV_LENGTH));
    const ciphertext = Buffer.from(
      encryptedData.slice(
        1 + IV_LENGTH,
        encryptedData.byteLength - AUTH_TAG_LENGTH,
      ),
    );

    const cipher = (crypto as any).createDecipheriv(CIPHER.server, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    cipher.setAuthTag(
      encryptedData.slice(
        encryptedData.byteLength - AUTH_TAG_LENGTH,
        encryptedData.length,
      ),
    );
    return create<SecretData>(
      Buffer.concat([cipher.update(ciphertext), cipher.final()]),
    );
  }

  function getSalt(): Salt {
    return create<Salt>(crypto.randomBytes(SALT_LENGTH));
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
    const signature = await encrypt(key, secretData(crypto.randomBytes(32)));
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
    const salt = create<Salt>(
      Buffer.from(lockedVault.slice(1, 1 + SALT_LENGTH)),
    );
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
