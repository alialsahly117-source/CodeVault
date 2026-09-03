import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { apiRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", apiRateLimit, async (_req, res, next) => {
  try {
    const [codes, prompts, users, categories] = await Promise.all([
      prisma.code.count({ where: { visibility: "PUBLIC", status: "PUBLISHED" } }),
      prisma.prompt.count({ where: { visibility: "PUBLIC", status: "PUBLISHED" } }),
      prisma.user.count(),
      prisma.category.count(),
    ]);
    res.json({ codes, prompts, users, categories });
  } catch (err) {
    next(err);
  }
});

export default router;
