import Opaque, {create} from 'ts-opaque';
import {bytesToBase64, base64ToBytes} from 'byte-base64';

export type Password = Opaque<Uint8Array, 'Password'>;
export type SecretData = Opaque<Uint8Array, 'SecretData'>;
export type EncryptedData = Opaque<Uint8Array, 'EncryptedData'>;

export type LockedVault = Opaque<Uint8Array, 'LockedVault'>;
export interface UnlockedVault {
  encrypt(secretData: SecretData): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData): Promise<SecretData>;
  lock(): LockedVault;
}

function encode(str: string): Uint8Array {
  const enc = new TextEncoder();
  return enc.encode(str);
}

export function password(str: Uint8Array | string): Password {
  return create<Password>(typeof str === 'string' ? encode(str) : str);
}

export function secretData(str: Uint8Array | string): SecretData {
  return create<SecretData>(typeof str === 'string' ? encode(str) : str);
}

export function secretDataToString(data: SecretData): string {
  const dec = new TextDecoder();
  return dec.decode(data);
}

export function encryptedData(
  encryptedData: string | Uint8Array,
): EncryptedData {
  return create<EncryptedData>(
    typeof encryptedData === 'string'
      ? base64ToBytes(encryptedData)
      : encryptedData,
  );
}
export function encryptedDataToString(encryptedData: EncryptedData) {
  return bytesToBase64(encryptedData);
}

export function lockedVault(lockedVault: string | Uint8Array): LockedVault {
  return create<LockedVault>(
    typeof lockedVault === 'string' ? base64ToBytes(lockedVault) : lockedVault,
  );
}
export function lockedVaultToString(lockedVault: LockedVault) {
  return bytesToBase64(lockedVault);
}

export interface SecureVault {
  createVault: (password: Password) => Promise<UnlockedVault>;
  unlockVault: (
    lockedVault: LockedVault,
    password: Password,
  ) => Promise<UnlockedVault>;
}
