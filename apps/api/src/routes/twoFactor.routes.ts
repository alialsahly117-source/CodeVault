import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import { startSession } from "../lib/session.js";
import { verifyTwoFactorPendingToken } from "../lib/jwt.js";
import {
  generateSecret,
  buildOtpauthUrl,
  generateQrCodeDataUrl,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  hashBackupCode,
} from "../lib/twoFactor.js";
import { enableTwoFactorSchema, disableTwoFactorSchema, twoFactorLoginSchema } from "../validators/twoFactor.validators.js";

const router = Router();

/** Checks a submitted code against either the live TOTP secret or an unused backup code. */
async function matchesTotpOrBackupCode(
  token: string,
  secret: string,
  backupCodes: string[]
): Promise<{ ok: boolean; usedBackupCode?: string }> {
  if (await verifyTotp(secret, token)) return { ok: true };
  const hashed = hashBackupCode(token);
  if (backupCodes.includes(hashed)) return { ok: true, usedBackupCode: hashed };
  return { ok: false };
}

// Generates a fresh secret + QR code for the authenticated user to scan.
// Deliberately not persisted until /enable confirms the user actually holds
// a working authenticator — an unconfirmed secret sitting in the database
// would just be dead weight (or worse, a way to silently overwrite a secret
// mid-setup without ever proving possession of it).
router.post("/setup", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError("المستخدم غير موجود.", 404);
    if (user.twoFactorEnabled) {
      throw new AppError("المصادقة الثنائية مفعّلة بالفعل على هذا الحساب.", 400);
    }

    const secret = generateSecret();
    const otpauthUrl = buildOtpauthUrl(user.email, secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpauthUrl);

    res.json({ secret, qrCodeDataUrl });
  } catch (err) {
    next(err);
  }
});

router.post("/enable", requireAuth, async (req, res, next) => {
  try {
    const { secret, token } = enableTwoFactorSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError("المستخدم غير موجود.", 404);
    if (user.twoFactorEnabled) {
      throw new AppError("المصادقة الثنائية مفعّلة بالفعل على هذا الحساب.", 400);
    }
    if (!(await verifyTotp(secret, token))) {
      throw new AppError("الرمز غير صحيح. تأكد من مزامنة تطبيق المصادقة.", 400);
    }

    const backupCodes = generateBackupCodes();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptSecret(secret),
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes.map(hashBackupCode),
      },
    });

    // The only time these plaintext codes ever exist outside the user's own
    // safekeeping — only their hashes are stored, so this response is the
    // one chance to hand them over.
    res.json({ backupCodes });
  } catch (err) {
    next(err);
  }
});

router.post("/disable", requireAuth, async (req, res, next) => {
  try {
    const { password, token } = disableTwoFactorSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError("المصادقة الثنائية غير مفعّلة على هذا الحساب.", 400);
    }

    // An account with a password must re-prove it here — otherwise a
    // hijacked but still-logged-in session could strip 2FA protection on
    // its own. Google-only accounts have no password to check, so a valid
    // second-factor code is the only thing standing in for it.
    if (user.passwordHash) {
      if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AppError("كلمة المرور غير صحيحة.", 401);
      }
    }

    const secret = decryptSecret(user.twoFactorSecret);
    const { ok } = await matchesTotpOrBackupCode(token, secret, user.twoFactorBackupCodes);
    if (!ok) throw new AppError("الرمز غير صحيح.", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: null, twoFactorEnabled: false, twoFactorBackupCodes: [] },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Completes a login that /api/auth/login paused because the account has 2FA
// enabled. Rate-limited the same as password login — a 6-digit TOTP code has
// far too small a space to leave unthrottled.
router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const { pendingToken, token } = twoFactorLoginSchema.parse(req.body);

    let userId: string;
    try {
      userId = verifyTwoFactorPendingToken(pendingToken);
    } catch {
      throw new AppError("انتهت صلاحية الجلسة المؤقتة. الرجاء تسجيل الدخول من جديد.", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== "ACTIVE") {
      throw new AppError("الحساب غير متاح.", 401);
    }
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError("المصادقة الثنائية غير مفعّلة على هذا الحساب.", 400);
    }

    const secret = decryptSecret(user.twoFactorSecret);
    const { ok, usedBackupCode } = await matchesTotpOrBackupCode(token, secret, user.twoFactorBackupCodes);
    if (!ok) throw new AppError("الرمز غير صحيح.", 401);

    if (usedBackupCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: user.twoFactorBackupCodes.filter((c) => c !== usedBackupCode) },
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await startSession(res, user);

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

export default router;
