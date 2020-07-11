import * as crypto from 'crypto';
import secureVault from './vault/server';
import {
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
} from './utils/types';

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

const {createVault, unlockVault} = secureVault(crypto);

export {createVault, unlockVault};
