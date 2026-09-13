import { EncryptionMetadata } from '../types';

// Convert string to Uint8Array
function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function uint8ToStr(buf: Uint8Array): string {
  return new TextDecoder().decode(buf);
}

// Buffer to hex string
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hex string to Uint8Array
function hexToUint8(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive AES-GCM-256 key from passphrase and salt using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute a 16-char fingerprint from passphrase or key for verification display
export async function computeFingerprint(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = bufToHex(hash);
  // Return formatted fingerprint: e.g. "E2EE-4F8A-99B2-CC10"
  return (
    'E2EE-' +
    hex.substring(0, 4).toUpperCase() +
    '-' +
    hex.substring(4, 8).toUpperCase() +
    '-' +
    hex.substring(8, 12).toUpperCase()
  );
}

/**
 * End-to-End Encrypt an email body using AES-256-GCM with PBKDF2 salt and random IV
 */
export async function encryptEmailContent(
  plainText: string,
  passphrase: string
): Promise<EncryptionMetadata> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const encryptedBuf = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    strToUint8(plainText) as BufferSource
  );

  const keyFingerprint = await computeFingerprint(passphrase);

  return {
    algorithm: 'AES-256-GCM / PBKDF2-SHA256 (100k iters)',
    keyFingerprint,
    iv: bufToHex(iv.buffer),
    salt: bufToHex(salt.buffer),
    cipherText: bufToHex(encryptedBuf),
  };
}

/**
 * Decrypt an E2EE email body using the passphrase
 */
export async function decryptEmailContent(
  encryptionData: EncryptionMetadata,
  passphrase: string
): Promise<string> {
  try {
    const salt = hexToUint8(encryptionData.salt);
    const iv = hexToUint8(encryptionData.iv);
    const cipherBytes = hexToUint8(encryptionData.cipherText);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuf = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      cipherBytes as BufferSource
    );

    return uint8ToStr(new Uint8Array(decryptedBuf));
  } catch (err) {
    throw new Error('Decryption failed. Incorrect passphrase or corrupted payload.');
  }
}
