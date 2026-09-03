import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { apiRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.get("/suggest", apiRateLimit, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ codes: [], prompts: [], tags: [] });

    const [codes, prompts, tags] = await Promise.all([
      prisma.code.findMany({
        where: { visibility: "PUBLIC", status: "PUBLISHED", title: { contains: q, mode: "insensitive" } },
        select: { id: true, title: true, language: true },
        take: 5,
      }),
      prisma.prompt.findMany({
        where: { visibility: "PUBLIC", status: "PUBLISHED", title: { contains: q, mode: "insensitive" } },
        select: { id: true, title: true, aiModel: true },
        take: 5,
      }),
      prisma.tag.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true },
        take: 5,
      }),
    ]);

    res.json({ codes, prompts, tags });
  } catch (err) {
    next(err);
  }
});

export default router;
