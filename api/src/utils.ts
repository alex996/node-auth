import { timingSafeEqual, createHash, createHmac } from "crypto";

// Crypto

// Perform a constant-time comparison when the strings have the same length.
export const safeEqual = (a: string, b: string) => {
  const aBuff = Buffer.from(a);
  const bBuff = Buffer.from(b);

  // NOTE crypto.timingSafeEqual() requires buffers of the same length.
  // We short-circuit when they have different lengths - this doesn't aid
  // in a timing attack https://github.com/nodejs/node/issues/17178
  return aBuff.length === bBuff.length && timingSafeEqual(aBuff, bBuff);
};

// SHA256 always produces a string that's 256 bits (or 32 bytes) long.
// In base64, that's ceil(32 / 3) * 4 = 44 characters long.
export const sha256 = (plaintext: string) =>
  createHash("sha256").update(plaintext).digest("base64");

export const hmacSha256 = (plaintext: string, key: string) =>
  createHmac("sha256", key).update(plaintext).digest("hex");

// String

export const compress = (str: string) => str.replace(/\s{2,}/g, "");
