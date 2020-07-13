import {create} from 'ts-opaque';
import {
  Password,
  UnlockedVault,
  LockedVault,
  SecretData,
  EncryptedData,
  secretData,
  password,
  secretDataToString,
  encryptedData,
  encryptedDataToString,
  lockedVault,
  lockedVaultToString,
} from './utils/types';
import {
  VERSION,
  SALT_LENGTH,
  PBKDF2_ITERATIONS,
  IV_LENGTH,
} from './utils/constants';

import environment, {Pbkdf2Key, Salt} from './environment/index';

export {
  Password,
  SecretData,
  EncryptedData,
  LockedVault,
  UnlockedVault,
  password,
  secretData,
  secretDataToString,
  encryptedData,
  encryptedDataToString,
  lockedVault,
  lockedVaultToString,
};

export {createVault, unlockVault};

function unlockedVault(
  key: Pbkdf2Key,
  lockedVault: LockedVault,
): UnlockedVault {
  return {
    async encrypt(secretData: SecretData) {
      const {iv, ciphertext} = await environment.encrypt(key, secretData);
      const encryptedData = create<EncryptedData>(
        new Uint8Array(1 + iv.length + ciphertext.length),
      );
      encryptedData[0] = VERSION;
      encryptedData.set(iv, 1);
      encryptedData.set(ciphertext, 1 + iv.length);
      return encryptedData;
    },
    async decrypt(encryptedData: EncryptedData) {
      if (encryptedData[0] !== VERSION) {
        throw new Error('Unsupported version');
      }
      return await environment.decrypt(key, {
        iv: create(encryptedData.slice(1, 1 + IV_LENGTH)),
        ciphertext: create(encryptedData.slice(1 + IV_LENGTH)),
      });
    },
    lock: () => lockedVault,
  };
}

async function createVault(password: Password): Promise<UnlockedVault> {
  const salt = environment.getSalt();
  const key = await environment.getKey(password, salt, {
    iterations: PBKDF2_ITERATIONS,
  });
  const {iv, ciphertext} = await environment.encrypt(
    key,
    secretData(environment.getSalt()),
  );
  const lockedVault = create<LockedVault>(
    new Uint8Array(1 + salt.length + iv.length + ciphertext.length),
  );
  lockedVault[0] = VERSION;
  lockedVault.set(salt, 1);
  lockedVault.set(iv, 1 + salt.length);
  lockedVault.set(ciphertext, 1 + salt.length + iv.length);
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
  const key = await environment.getKey(password, salt, {
    iterations: PBKDF2_ITERATIONS,
  });
  await environment.decrypt(key, {
    iv: create(lockedVault.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH)),
    ciphertext: create(lockedVault.slice(1 + SALT_LENGTH + IV_LENGTH)),
  });
  return unlockedVault(key, lockedVault);
}
