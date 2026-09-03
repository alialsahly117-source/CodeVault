import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import passport from "../config/passport.js";
import { prisma } from "../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { setAuthCookies, clearAuthCookies } from "../lib/cookies.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validators.js";

const router = Router();

router.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const settings = await prisma.setting.findUnique({ where: { id: "singleton" } });
    if (settings && !settings.allowRegistration) {
      throw new AppError("التسجيل مغلق حاليًا. الرجاء المحاولة لاحقًا.", 403);
    }

    const { email, password, displayName } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("هذا البريد الإلكتروني مستخدم بالفعل.", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: { displayName } },
      },
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new AppError("البريد الإلكتروني أو كلمة المرور غير صحيحة.", 401);
    }
    if (user.status === "BANNED") {
      throw new AppError("تم حظر هذا الحساب.", 403);
    }
    if (user.status === "SUSPENDED") {
      throw new AppError("حسابك موقوف مؤقتًا. تواصل مع الدعم لمزيد من المعلومات.", 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("البريد الإلكتروني أو كلمة المرور غير صحيحة.", 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookies(res);
  res.status(204).end();
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) throw new AppError("غير مصرح.", 401);

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") throw new AppError("غير مصرح.", 401);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch {
    next(new AppError("الجلسة غير صالحة، الرجاء تسجيل الدخول مجددًا.", 401));
  }
});

router.post("/forgot-password", authRateLimit, async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way to avoid leaking which emails exist.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      // TODO: integrate a real email provider. For now log the reset link for local dev.
      // eslint-disable-next-line no-console
      console.log(`رابط إعادة تعيين كلمة المرور لـ ${email}: /reset-password?token=${rawToken}`);
    }

    res.json({ message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور." });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", authRateLimit, async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية.", 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    res.json({ message: "تم تحديث كلمة المرور بنجاح." });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });
    if (!user) throw new AppError("المستخدم غير موجود.", 404);
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      hasPassword: !!user.passwordHash,
      hasGoogle: !!user.googleId,
      profile: user.profile,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        ...(data.displayName ? { displayName: data.displayName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl || null } : {}),
      },
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Google OAuth — public-site login only; the admin dashboard never exposes this.
const webUrl = process.env.WEB_URL || process.env.CLIENT_URL || "http://localhost:5173";

function requireGoogleConfigured(_req: Request, res: Response, next: NextFunction) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${webUrl}/login?error=google_not_configured`);
  }
  next();
}

router.get(
  "/google",
  requireGoogleConfigured,
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  requireGoogleConfigured,
  passport.authenticate("google", { session: false, failureRedirect: `${webUrl}/login?error=google` }),
  async (req, res) => {
    const user = req.user as { id: string; role: "USER" | "EDITOR" | "MODERATOR" | "ADMIN" };
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, accessToken, refreshToken);
    res.redirect(`${webUrl}/`);
  }
);

export default router;
