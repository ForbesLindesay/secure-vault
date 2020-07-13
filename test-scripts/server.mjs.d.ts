export default function run(): Promise<
  | {
      success: true;
      locked: string;
      ciphertext: string;
    }
  | {success: false; message: string}
>;
export async function testDecryptClient(
  lockedStr,
  encryptedStr,
): Promise<
  | {
      success: true;
    }
  | {success: false; message: string}
>;
