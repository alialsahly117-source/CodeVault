import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireEditor, requireModerator } from "../../middleware/rbac.js";
import { moderateContentSchema } from "../../validators/admin.validators.js";
import { logAction } from "./_logAction.js";
import { publicUserSelect } from "../../lib/selects.js";

const router = Router();

router.get("/codes", requireEditor, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = req.query.status as string | undefined;
    const q = String(req.query.q || "");
    const where = {
      ...(status ? { status: status as never } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.code.findMany({
        where,
        include: { author: { select: publicUserSelect }, category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.code.count({ where }),
    ]);
    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch("/codes/:id/status", requireModerator, async (req, res, next) => {
  try {
    const { status } = moderateContentSchema.parse(req.body);
    const code = await prisma.code.update({ where: { id: req.params.id }, data: { status } });
    await logAction(req, "moderate_code", "code", code.id, { status });
    res.json(code);
  } catch (err) {
    next(err);
  }
});

router.delete("/codes/:id", requireModerator, async (req, res, next) => {
  try {
    await prisma.code.delete({ where: { id: req.params.id } });
    await logAction(req, "delete_code", "code", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get("/prompts", requireEditor, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = req.query.status as string | undefined;
    const q = String(req.query.q || "");
    const where = {
      ...(status ? { status: status as never } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: { author: { select: publicUserSelect }, category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prompt.count({ where }),
    ]);
    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch("/prompts/:id/status", requireModerator, async (req, res, next) => {
  try {
    const { status } = moderateContentSchema.parse(req.body);
    const prompt = await prisma.prompt.update({ where: { id: req.params.id }, data: { status } });
    await logAction(req, "moderate_prompt", "prompt", prompt.id, { status });
    res.json(prompt);
  } catch (err) {
    next(err);
  }
});

router.delete("/prompts/:id", requireModerator, async (req, res, next) => {
  try {
    await prisma.prompt.delete({ where: { id: req.params.id } });
    await logAction(req, "delete_prompt", "prompt", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
