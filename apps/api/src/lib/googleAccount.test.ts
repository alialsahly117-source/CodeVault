import { describe, it, expect, beforeEach } from "vitest";
import { resolveGoogleUser } from "./googleAccount.js";
import { resetDb, prisma } from "../test/db.js";
import { createUser, uniqueEmail } from "../test/helpers.js";

beforeEach(async () => {
  await resetDb();
});

describe("resolveGoogleUser", () => {
  it("creates an account when the Google identity is entirely new", async () => {
    const email = uniqueEmail("fresh");

    const result = await resolveGoogleUser({ googleId: "g-new", email, displayName: "Fresh User" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.email).toBe(email);
    expect(result.user.googleId).toBe("g-new");
    const profile = await prisma.profile.findUnique({ where: { userId: result.user.id } });
    expect(profile?.displayName).toBe("Fresh User");
  });

  it("links Google to an existing password account with the same address", async () => {
    const { user, email } = await createUser();

    const result = await resolveGoogleUser({ googleId: "g-link", email });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Same account, not a second one — the password login must keep working.
    expect(result.user.id).toBe(user.id);
    expect(result.user.googleId).toBe("g-link");
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it("returns the already-linked account on a repeat login", async () => {
    const { user, email } = await createUser();
    await prisma.user.update({ where: { id: user.id }, data: { googleId: "g-repeat" } });

    const result = await resolveGoogleUser({ googleId: "g-repeat", email });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe(user.id);
  });

  // The regression this file exists for. Two rows match the incoming
  // identity: one by address, a different one by googleId. The old OR-based
  // lookup returned whichever the database ordered first — and when that was
  // the address row, writing the googleId onto it collided with the other
  // row's unique googleId and reached the user as a raw Prisma P2002.
  it("returns the linked account when the googleId and the address are on different rows", async () => {
    const { email: addressOnly } = await createUser();
    const { user: googleOwner } = await createUser();
    await prisma.user.update({ where: { id: googleOwner.id }, data: { googleId: "g-shared" } });

    const result = await resolveGoogleUser({ googleId: "g-shared", email: addressOnly });

    // The googleId is the identity Google actually authenticated, so it wins.
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe(googleOwner.id);
    expect(result.user.googleId).toBe("g-shared");
  });

  it("refuses when the address is already linked to a different Google account", async () => {
    const { user, email } = await createUser();
    await prisma.user.update({ where: { id: user.id }, data: { googleId: "g-original" } });

    const result = await resolveGoogleUser({ googleId: "g-impostor", email });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("google_account_conflict");
    // The original link must be left exactly as it was.
    const unchanged = await prisma.user.findUnique({ where: { id: user.id } });
    expect(unchanged?.googleId).toBe("g-original");
  });
});
