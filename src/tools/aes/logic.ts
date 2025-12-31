import {
  base64ToBytes,
  bytesToBase64,
  bytesToText,
  textToBytes,
} from "@/lib/bytes";
import { ToolError } from "../text-tool";

/**
 * Password-based AES-GCM, as WebCrypto does it.
 *
 * The output is one Base64 blob holding salt ‖ iv ‖ ciphertext, so there is a
 * single thing to copy and nothing to keep track of separately. Both are
 * random per encryption, which is why encrypting the same text twice gives two
 * different results — and why reusing this tool's output as a fixture does not
 * work, which is the right lesson for a tool people reach for casually.
 *
 * PBKDF2 at 250k iterations of SHA-256 turns the passphrase into a key. That
 * is the accepted floor rather than a strong setting; a passphrase is the weak
 * part of this and no iteration count fixes a short one.
 */
const ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    textToBytes(passphrase) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function requirePassphrase(passphrase: string) {
  if (!passphrase) {
    throw new ToolError({
      tr: "Parola girilmedi.",
      en: "No passphrase given.",
    });
  }
}

export async function encrypt(
  input: string,
  passphrase: string,
): Promise<string> {
  if (!input) return "";
  requirePassphrase(passphrase);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      textToBytes(input) as BufferSource,
    ),
  );

  const blob = new Uint8Array(salt.length + iv.length + ciphertext.length);
  blob.set(salt, 0);
  blob.set(iv, salt.length);
  blob.set(ciphertext, salt.length + iv.length);
  return bytesToBase64(blob);
}

export async function decrypt(
  input: string,
  passphrase: string,
): Promise<string> {
  if (!input.trim()) return "";
  requirePassphrase(passphrase);

  let blob: Uint8Array;
  try {
    blob = base64ToBytes(input);
  } catch {
    throw new ToolError({
      tr: "Girdi geçerli bir Base64 değeri değil.",
      en: "The input is not valid Base64.",
    });
  }

  if (blob.length <= SALT_BYTES + IV_BYTES) {
    throw new ToolError({
      tr: "Veri bu araçla şifrelenmiş bir bloğa benzemiyor.",
      en: "This does not look like a blob produced by this tool.",
    });
  }

  const salt = blob.subarray(0, SALT_BYTES);
  const iv = blob.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ciphertext = blob.subarray(SALT_BYTES + IV_BYTES);
  const key = await deriveKey(passphrase, salt);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );
  } catch {
    // GCM cannot tell "wrong key" from "tampered data" — that is the point of
    // it — so the message says both.
    throw new ToolError({
      tr: "Çözülemedi: parola yanlış ya da veri değişmiş.",
      en: "Could not decrypt: wrong passphrase, or the data was altered.",
    });
  }

  try {
    return bytesToText(new Uint8Array(plaintext));
  } catch {
    throw new ToolError({
      tr: "Çözülen veri metin değil.",
      en: "The decrypted data is not text.",
    });
  }
}
