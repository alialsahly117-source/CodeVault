import type { NextFunction, Request, Response } from "express";
import type { Role } from "./auth.js";

/**
 * Role hierarchy: USER < EDITOR < MODERATOR < ADMIN.
 * Every admin-area route must call one of these guards itself — the admin
 * frontend hiding a button or a link is never sufficient authorization on its own.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "لا تملك الصلاحية الكافية لتنفيذ هذا الإجراء." });
    }
    next();
  };
}

export const requireAdmin = requireRole("ADMIN");
export const requireModerator = requireRole("ADMIN", "MODERATOR");
export const requireEditor = requireRole("ADMIN", "MODERATOR", "EDITOR");
