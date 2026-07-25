/**
 * PasswordHasher
 *
 * Hashes and verifies passwords using PBKDF2-SHA-512 via Node's
 * built-in crypto module. Plaintext passwords are never stored or
 * returned.
 *
 * Format: iterations:salt(hex):hash(hex)
 */

import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "sha512";
const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const SALT_BYTES = 32;
const SEPARATOR = ":";

function deriveKey(
  password: string,
  saltHex: string,
  iterations: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2(
      password,
      Buffer.from(saltHex, "hex"),
      iterations,
      KEY_LENGTH,
      ALGORITHM,
      (err, key) => {
        if (err !== null) {
          reject(err);
        } else {
          resolve(key);
        }
      }
    );
  });
}

export async function hashPassword(plaintext: string): Promise<string> {
  const saltHex = randomBytes(SALT_BYTES).toString("hex");
  const key = await deriveKey(plaintext, saltHex, ITERATIONS);
  return [ITERATIONS, saltHex, key.toString("hex")].join(SEPARATOR);
}

export async function verifyPassword(
  plaintext: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(SEPARATOR);

  if (parts.length !== 3) {
    return false;
  }

  const [iterStr, saltHex, hashHex] = parts as [string, string, string];
  const iterations = Number(iterStr);

  if (!Number.isInteger(iterations) || iterations < 1) {
    return false;
  }

  const storedBuffer = Buffer.from(hashHex, "hex");
  const derivedBuffer = await deriveKey(plaintext, saltHex, iterations);

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedBuffer);
}