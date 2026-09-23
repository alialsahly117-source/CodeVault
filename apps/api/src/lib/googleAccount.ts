import type { User } from "@prisma/client";
import { prisma } from "./prisma.js";

export interface GoogleIdentity {
  googleId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export type GoogleResolution =
  | { ok: true; user: User }
  /** The address belongs to an account already linked to a different Google login. */
  | { ok: false; reason: "google_account_conflict" };

/**
 * Maps a Google identity onto a CodeVault account, creating or linking one.
 *
 * Deliberately two `findUnique` lookups, googleId first, rather than a single
 * `findFirst` with an OR over both columns: the OR can match two *different*
 * rows (one by googleId, one by email) and return whichever the database
 * happens to order first. Writing the googleId onto that row then collides
 * with the other row's unique googleId — which reached users as a raw
 * "هذه القيمة مستخدمة بالفعل" (Prisma P2002) in the middle of logging in.
 */
export async function resolveGoogleUser(identity: GoogleIdentity): Promise<GoogleResolution> {
  const linked = await prisma.user.findUnique({ where: { googleId: identity.googleId } });
  if (linked) return { ok: true, user: linked };

  const byEmail = await prisma.user.findUnique({ where: { email: identity.email } });

  if (!byEmail) {
    const created = await prisma.user.create({
      data: {
        email: identity.email,
        googleId: identity.googleId,
        profile: {
          create: {
            displayName: identity.displayName || identity.email.split("@")[0],
            avatarUrl: identity.avatarUrl,
          },
        },
      },
    });
    return { ok: true, user: created };
  }

  // Silently re-pointing the address would hand this login someone else's
  // account, so refuse rather than guess.
  if (byEmail.googleId && byEmail.googleId !== identity.googleId) {
    return { ok: false, reason: "google_account_conflict" };
  }

  // Existing password account, same address — link the two.
  const linkedNow = await prisma.user.update({
    where: { id: byEmail.id },
    data: { googleId: identity.googleId },
  });
  return { ok: true, user: linkedNow };
}
