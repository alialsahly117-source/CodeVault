import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { apiRateLimit } from "../middleware/rateLimit.js";

const router = Router();

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
    res.json(saved);
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
    res.json(liked);
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
