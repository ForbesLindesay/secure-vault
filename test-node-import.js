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
} = require('secure-vault');

async function run() {
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
  if (decrypted !== 'My Message') {
    console.error('Incorrect decrypted message: ' + decrypted);
    process.exit(1);
  } else {
    console.log('Everything looks like it is working');
  }
}
run().catch((ex) => {
  console.error(ex.stack || ex.message || ex);
  process.exit(1);
});
