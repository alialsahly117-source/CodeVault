import crypto from "node:crypto";
import type { Response } from "express";
import { prisma } from "./prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt.js";
import { setAuthCookies, clearAuthCookies } from "./cookies.js";
import type { Role } from "../middleware/auth.js";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Two browser tabs can legitimately refresh at nearly the same moment, both
 * holding the same (still-current) token. Treating that as theft would log
 * honest users out, so a replay this soon after the first use is tolerated;
 * a replay later than this is the signal we actually care about.
 */
const REUSE_GRACE_MS = 30_000;

export class SessionError extends Error {}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(userId: string, role: Role, familyId: string) {
  const token = signRefreshToken({ sub: userId, role, jti: crypto.randomUUID() });
  await prisma.refreshToken.create({
    data: {
      userId,
      familyId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return token;
}

/** Begins a new session — login, registration, or a completed OAuth callback. */
export async function startSession(res: Response, user: { id: string; role: Role }) {
  // Opportunistic housekeeping: without this the table only ever grows.
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const refreshToken = await issueRefreshToken(user.id, user.role, crypto.randomUUID());
  setAuthCookies(res, signAccessToken({ sub: user.id, role: user.role }), refreshToken);
}

/**
 * Consumes the presented refresh token and issues its replacement. Throws
 * SessionError for anything the caller should answer with a 401.
 */
export async function rotateSession(res: Response, rawToken: string) {
  const payload = verifyRefreshToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });

  // A structurally valid JWT with no row behind it is either forged, or was
  // issued before rotation existed, or belongs to a family we already
  // revoked. None of those should be honoured.
  if (!record) throw new SessionError("لا يوجد سجل لهذا الرمز.");

  if (record.usedAt && Date.now() - record.usedAt.getTime() > REUSE_GRACE_MS) {
    // The token was already spent and this isn't a tab race — assume it
    // leaked and drop every session descended from the same login.
    await prisma.refreshToken.deleteMany({ where: { familyId: record.familyId } });
    throw new SessionError("تم رصد إعادة استخدام رمز الجلسة.");
  }

  if (record.expiresAt < new Date()) throw new SessionError("انتهت صلاحية الجلسة.");
  if (record.userId !== payload.sub) throw new SessionError("الرمز لا يطابق صاحبه.");

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || user.status !== "ACTIVE") throw new SessionError("الحساب غير متاح.");

  await prisma.refreshToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  const refreshToken = await issueRefreshToken(user.id, user.role, record.familyId);
  setAuthCookies(res, signAccessToken({ sub: user.id, role: user.role }), refreshToken);

  return user;
}

/** Ends the session the presented token belongs to, and clears the cookies. */
export async function endSession(res: Response, rawToken?: string) {
  if (rawToken) {
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
    if (record) {
      await prisma.refreshToken.deleteMany({ where: { familyId: record.familyId } });
    }
  }
  clearAuthCookies(res);
}

/** Drops every session a user has — used on password reset and on ban/suspend. */
export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
