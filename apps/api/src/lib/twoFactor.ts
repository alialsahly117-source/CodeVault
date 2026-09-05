import crypto from "node:crypto";
import { generateSecret as otpGenerateSecret, generateURI, verify as otpVerify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "CodeVault";
const BACKUP_CODE_COUNT = 10;
// Tolerates one 30s step of clock drift on either side, matching how every
// mainstream authenticator app (Google/Microsoft/Authy) is configured.
const EPOCH_TOLERANCE_SECONDS = 30;

// TOTP secrets are stored encrypted, not hashed — unlike a password, the
// server has to read the original value back on every login to compute the
// expected code. The raw env value doesn't have to be exactly 32 bytes of
// hex; hashing it first always yields a valid AES-256 key regardless of what
// shape the operator's secret is in.
function getEncryptionKey() {
  return crypto.createHash("sha256").update(process.env.TWO_FACTOR_ENCRYPTION_KEY as string).digest();
}

export function generateSecret() {
  return otpGenerateSecret();
}

export function buildOtpauthUrl(email: string, secret: string) {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export function generateQrCodeDataUrl(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl);
}

export async function verifyTotp(secret: string, token: string) {
  try {
    const result = await otpVerify({ secret, token, epochTolerance: EPOCH_TOLERANCE_SECONDS });
    return result.valid;
  } catch {
    // A malformed token (wrong length/non-numeric) throws rather than
    // returning false — either way it just means "not a valid code".
    return false;
  }
}

export function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSecret(payload: string) {
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Plaintext codes are returned to the client exactly once, at enable time. */
export function generateBackupCodes(count = BACKUP_CODE_COUNT) {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString("hex"));
}

export function hashBackupCode(code: string) {
  return crypto.createHash("sha256").update(code.toLowerCase().trim()).digest("hex");
}
