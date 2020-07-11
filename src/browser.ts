import secureVault from './vault/browser';
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

const {createVault, unlockVault} = secureVault(window.crypto);

export {createVault, unlockVault};
