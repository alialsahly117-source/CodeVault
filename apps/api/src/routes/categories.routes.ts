import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { apiRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", apiRateLimit, async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: { select: { codes: true, prompts: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
