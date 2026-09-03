import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export type Role = "USER" | "EDITOR" | "MODERATOR" | "ADMIN";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      role: Role;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    return res.status(401).json({ error: "غير مصرح. الرجاء تسجيل الدخول." });
  }
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "الحساب غير متاح." });
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: "الجلسة غير صالحة أو منتهية." });
  }
}

// Publishing is a staff-only capability for now — opening it up to regular
// users is planned as a paid subscription feature, not launched yet.
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "نشر المحتوى متاح حاليًا لطاقم العمل فقط." });
    }
    next();
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.status === "ACTIVE") {
      req.user = { id: user.id, role: user.role };
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
