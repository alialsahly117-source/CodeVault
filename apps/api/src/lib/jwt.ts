import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "../middleware/auth.js";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_TTL = (process.env.JWT_ACCESS_TTL || "15m") as SignOptions["expiresIn"];
const REFRESH_TTL = (process.env.JWT_REFRESH_TTL || "30d") as SignOptions["expiresIn"];

export interface JwtPayload {
  sub: string;
  role: Role;
}

/**
 * Refresh tokens carry a random jti purely so two tokens issued for the same
 * user in the same second aren't byte-identical — they're stored by hash,
 * and identical strings would collide on that unique index.
 */
export interface RefreshJwtPayload extends JwtPayload {
  jti: string;
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: RefreshJwtPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
