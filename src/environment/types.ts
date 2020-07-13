import Opaque from 'ts-opaque';
import {Password, SecretData} from '../utils/types';

/**
 * The Salt must be unique for every password and must be at least
 * 16 bytes long.
 * It does not need to be kept private.
 */
export type Salt = Opaque<Uint8Array, 'salt'>;

/**
 * The ciphertext contains the encrypted data. You need the key and
 * the IV to read it.
 */
export type Ciphertext = Opaque<Uint8Array, 'ciphertext'>;

/**
 * The IV must be unique for every encryption operation carried out using
 * the same key and should be at least 12 bytes long.
 * It does not need to be kept private.
 */
export type IV = Opaque<Uint8Array, 'iv'>;

interface Options {
  iterations: number;
}
export interface Environment<Pbkdf2Key> {
  getSalt(): Salt;
  getKey(password: Password, salt: Salt, options: Options): Promise<Pbkdf2Key>;
  encrypt(
    key: Pbkdf2Key,
    message: SecretData,
  ): Promise<{ciphertext: Ciphertext; iv: IV}>;
  decrypt(
    key: Pbkdf2Key,
    message: {ciphertext: Ciphertext; iv: IV},
  ): Promise<SecretData>;
}
