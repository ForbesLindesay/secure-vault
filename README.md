# secure-vault

Secure, password based symetric encryption. When you create a "vault" it can be used to encrypt and decrypt multiple messages with a single password.

> N.B. server side usage requires at least node.js version 14

[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen)](https://rollingversions.com/ForbesLindesay/secure-vault)

## Installation

```
yarn add secure-vault
```

## Usage

```ts
import {
  createVault,
  unlockVault,
  password,
  secretData,
  secretDataToString,
} from 'secure-vault';

const unlocked = createVault(password('My super secure password'));

// You can encrypt something using the unlocked vault. The resulting cipherText
// safe to share:
const encrypted = unlocked.encrypt(secretData('My secret message'));

// To access the data later, you'll need a way to retrieve the same vault.
// To do this, you can `lock` the vault, which creates a serializable
// copy of the vault that can only be unlocked using the password.
const locked = unlocked.lock();

// Assuming you've saved the `lockedVaultStr` and `cipherTextStr`, and you know
// the secret password, you can unlock the vault and then decrypt your data:
const unlocked2 = unlockVault(locked, password('My super secure password'));

const secret = secretDataToString(unlocked2.decrypt(encrypted));
console.log(secret);
// => 'My secret message'
```

## API

### `Password`

The password is the secret phrase that's used to encrypt the data. Ideally this should be as long as possible, to keep the data secure. You can create a `Password` from a `string` using:

```ts
import {password} from 'secure-vault';

const pwd = password('My Secret Pass Phrase');
```

_(You can alternatively create one from a Uint8 array by passing the Uint8 array to `password`)_

### `SecretData`

The secret data is the data you want to encrypt, or the data you have decrypted. You can create `SecretData` from a `string` using:

```ts
import {secretData} from 'secure-vault';

// N.B. "data" here is not yet encrypted
const data = secretData('A secret I want to hide');
```

You can also convert `SecretData` back into a string using:

```ts
import {secretDataToString} from 'secure-vault';

// N.B. "data" here is not yet encrypted
const str = secretDataToString(data);
```

_(You can alternatively use a Uint8 array by passing the Uint8 array to `secretData`)_

### `EncryptedData`

The encrypted data is safe to share publicly. The only way to decrypt the encrypted data is to have access to either the `UnlockedVault` or both the `LockedVault` and the `Password`. You can directly store the encrypted data as a `Uint8Array` or you can convert it to and from a string:

```ts
import {encryptedData, encryptedDataToString} from 'secure-vault';

const str = encryptedDataToString(encrypted);
const encrypted = encryptedData(str);
```

### `LockedVault`

A locked vault represents the key used to encrypt and decrypt the data, but it cannot be used until it's unlocked. The only way to unlock it is with the password. The locked vault must be stored somewhere along with the encrypted data, but you can reuse the same vault for many different encrypted values. You can directly store the locked vault as a `Uint8Array` or you can convert it to and from a string:

```ts
import {lockedVault, lockedVaultToString} from 'secure-vault';

const str = lockedVaultToString(locked);
const locked = lockedVault(str);
```

### `UnlockedVault`

An unlocked vault represents a vault with its associated password. You can use the unlocked vault to encrypt and decrypt any amount of data you need. To store the keys, you should "lock" the vault.

Creating a vault:

```ts
import {createVault, password, lockedVaultToString} from 'secure-vault';

const unlocked = createVault(password('My secret password'));
const lockedStr = lockedVaultToString(unlocked.lock());
```

Unlocking a vault:

```ts
import {unlockVault, password, lockedVault} from 'secure-vault';

const unlocked = unlockVault(lockedVault(lockedStr), password('My secret password'));
```

#### `unlockedVault.encrypt(secretData: SecretData) => Promise<EncryptedData>`

You can call `unlockedVault.encrypt` to encrypt some secret data:

```ts
const encryptedStr = encryptedDataToString(await unlockedVault.encrypt(secretData('My Secret Message')));
```

#### `unlockedVault.decrypt(encryptedData: EncryptedData) => Promise<SecretData>`

You can call `unlockedVault.encrypt` to decrypt some encrtyped data:

```ts
const mySecretMessage = secretDataToString(await unlockedVault.decrypt(encryptedData(encryptedStr)));
```

#### `unlockedVault.lock() => LockedVault`

You can get a locked vault for storage by calling `unlockedVault.lock()`.

