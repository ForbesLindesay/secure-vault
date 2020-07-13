const {
  createVault,
  secretData,
  password,
  unlockVault,
  secretDataToString,
  lockedVaultToString,
  encryptedDataToString,
  encryptedData,
  lockedVault,
} = require('../');

// BEGIN_SERVER_INPUT
const SERVER_LOCKED =
  'Ac8Ol3d0zfC5cLfOlibmgIduGVDtSQLVneE67/F6IT49c/StXxkpjsnk0/2+vn6LIn25p697Daa+4Ef6Pw==';
const SERVER_CIPHERTEXT =
  'ARQOj6TZRGufpmTQVwr5YwCOJwGr9h5XDczWeIQFq2ypGI2NmaZM';
// END_SERVER_INPUT

async function run() {
  const serverVault = await unlockVault(
    lockedVault(SERVER_LOCKED),
    password('My Password'),
  );
  const serverDecrypted = secretDataToString(
    await serverVault.decrypt(encryptedData(SERVER_CIPHERTEXT)),
  );
  if (serverDecrypted !== 'My Message') {
    return {
      success: false,
      message: 'Incorrect decrypted server message: ' + serverDecrypted,
    };
  }

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
run().then(
  (result) => {
    console.log(JSON.stringify(result));
    window.close();
  },
  (ex) => {
    console.log(
      JSON.stringify({
        success: false,
        message: (ex.stack || ex.message || ex).toString(),
      }),
    );
    window.close();
  },
);
