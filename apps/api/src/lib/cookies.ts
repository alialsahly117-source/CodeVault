import type { CookieOptions, Response } from "express";

const secure = process.env.COOKIE_SECURE === "true";
// In production, set COOKIE_DOMAIN=".codevault.com" so the auth cookie set by
// api.codevault.com is also readable by admin.codevault.com and codevault.com.
// Leave unset for local dev — cookies then default to the exact host (which,
// for "localhost", is already shared across every localhost port).
const domain = process.env.COOKIE_DOMAIN || undefined;

const base: CookieOptions = { httpOnly: true, secure, sameSite: "lax", domain };

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000, path: "/" });
  res.cookie("refreshToken", refreshToken, {
    ...base,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh",
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", { path: "/", domain });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh", domain });
}
