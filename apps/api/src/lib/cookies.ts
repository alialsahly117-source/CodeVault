import type { CookieOptions, Response } from "express";

const secure = process.env.COOKIE_SECURE === "true";
// "lax" works for local dev (web/admin/api all share the "localhost" host).
// In production the three apps live on unrelated domains (e.g. *.netlify.app
// frontends calling an *.onrender.com API) — that is a genuinely cross-site
// request, so the cookie needs SameSite=None (which browsers only honor when
// Secure is also set). Set COOKIE_SAMESITE=none in that deployment's env.
const sameSite = (process.env.COOKIE_SAMESITE as CookieOptions["sameSite"]) || "lax";
// SameSite=None is rejected by browsers unless Secure is also set.
const effectiveSecure = sameSite === "none" ? true : secure;

// Only relevant when the frontends share a REGISTRABLE parent domain with the
// API (e.g. api.codevault.com + admin.codevault.com under ".codevault.com").
// Leave unset for local dev, and leave unset for the netlify.app/onrender.com
// setup above — those domains share nothing, so a Domain attribute can't help
// and SameSite=None + CORS is what makes that case work instead.
const domain = process.env.COOKIE_DOMAIN || undefined;

const base: CookieOptions = { httpOnly: true, secure: effectiveSecure, sameSite, domain };

// The refresh cookie was previously scoped to /api/auth/refresh so it
// wouldn't ride along on every request. That also meant it never reached
// /api/auth/logout — which left logout unable to revoke the session
// server-side, the one thing it most needs to do now that refresh tokens
// are tracked and revocable. Reliable revocation is worth more than the
// narrower path: the cookie is still httpOnly + Secure and only ever
// travels to our own API over HTTPS.
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000, path: "/" });
  res.cookie("refreshToken", refreshToken, {
    ...base,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", { path: "/", domain });
  res.clearCookie("refreshToken", { path: "/", domain });
  // Old sessions were issued with the narrower path; without clearing that
  // variant too, a stale cookie would linger in browsers after logout.
  res.clearCookie("refreshToken", { path: "/api/auth/refresh", domain });
}
