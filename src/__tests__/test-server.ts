import {
  createVault,
  secretData,
  password,
  unlockVault,
  secretDataToString,
  lockedVaultToString,
  encryptedDataToString,
  encryptedData,
  lockedVault,
} from '../server';

export default async function run() {
  const unlocked = await createVault(password('My Password'));
  const locked = unlocked.lock();

  const ciphertext = await unlocked.encrypt(secretData('My Message'));

  const second = await unlockVault(
    lockedVault(lockedVaultToString(locked)),
    password('My Password'),
  );
  const decrypted = secretDataToString(
    await second.decrypt(encryptedData(encryptedDataToString(ciphertext))),
  );
  if (decrypted === 'My Message') {
    return {
      success: true,
      locked: lockedVaultToString(locked),
      ciphertext: encryptedDataToString(ciphertext),
    };
  } else {
    return {
      success: false,
      message: 'Incorrect decrypted message: ' + decrypted,
    };
  }
}

export async function testDecryptClient(
  lockedStr: string,
  encryptedStr: string,
) {
  const second = await unlockVault(
    lockedVault(lockedStr),
    password('My Password'),
  );
  const decrypted = secretDataToString(
    await second.decrypt(encryptedData(encryptedStr)),
  );
  if (decrypted === 'My Message') {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      message: 'Incorrect decrypted message: ' + decrypted,
    };
  }
}
