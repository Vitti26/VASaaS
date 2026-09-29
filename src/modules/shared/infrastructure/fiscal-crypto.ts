import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
function getFiscalSecretKey(): string {
  const key = process.env.FISCAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("FISCAL_ENCRYPTION_KEY no configurado");
  }
  return key;
}

function getDerivedKey(keyPhrase: string): Buffer {
  return crypto.createHash("sha256").update(keyPhrase).digest();
}

/**
 * Encrypts sensitive fiscal data (such as private keys or certificates) using AES-256-GCM.
 */
export function encryptFiscalSecret(plainText: string, keyPhrase?: string): string {
  const secretKey = keyPhrase || getFiscalSecretKey();
  const iv = crypto.randomBytes(12);
  const key = getDerivedKey(secretKey);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Output format: iv:authTag:encryptedHex
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted fiscal data.
 */
export function decryptFiscalSecret(cipherText: string, keyPhrase?: string): string {
  const secretKey = keyPhrase || getFiscalSecretKey();
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de texto cifrado fiscal inválido");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getDerivedKey(secretKey);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks sensitive string for log output so private key / certificate contents are never exposed.
 */
export function maskSensitiveString(str: string): string {
  if (!str || str.length <= 8) return "********";
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}
