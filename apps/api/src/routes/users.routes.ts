import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { apiRateLimit } from "../middleware/rateLimit.js";
import { canView } from "../lib/visibility.js";

const router = Router();

// Defense in depth alongside the visibility checks on like/save/copy/report:
// even if a row ever exists pointing at content the requester can't see
// (e.g. it was made private/hidden after being saved), never return the
// underlying title/description/content for it here.
function visibleOnly<T extends { code: unknown; prompt: unknown }>(
  rows: T[],
  user: { id: string; role: string }
): T[] {
  return rows.filter((row) => {
    const item = (row.code ?? row.prompt) as
      | { authorId: string; visibility: "PUBLIC" | "PRIVATE"; status: "PUBLISHED" | "HIDDEN" | "PENDING" }
      | null;
    return !!item && canView(item, user);
  });
}

router.get("/me/saved", requireAuth, apiRateLimit, async (req, res, next) => {
  try {
    const saved = await prisma.savedItem.findMany({
      where: { userId: req.user!.id },
      include: {
        code: { include: { tags: { include: { tag: true } }, category: true } },
        prompt: { include: { tags: { include: { tag: true } }, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(visibleOnly(saved, req.user!));
  } catch (err) {
    next(err);
  }
});

router.get("/me/liked", requireAuth, apiRateLimit, async (req, res, next) => {
  try {
    const liked = await prisma.like.findMany({
      where: { userId: req.user!.id },
      include: {
        code: { include: { tags: { include: { tag: true } }, category: true } },
        prompt: { include: { tags: { include: { tag: true } }, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(visibleOnly(liked, req.user!));
  } catch (err) {
    next(err);
  }
});

router.get("/me/contributions", requireAuth, apiRateLimit, async (req, res, next) => {
  try {
    const [codes, prompts] = await Promise.all([
      prisma.code.findMany({
        where: { authorId: req.user!.id },
        include: { tags: { include: { tag: true } }, category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prompt.findMany({
        where: { authorId: req.user!.id },
        include: { tags: { include: { tag: true } }, category: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    res.json({ codes, prompts });
  } catch (err) {
    next(err);
  }
});

export default router;
