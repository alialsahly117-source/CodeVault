import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireEditor } from "../../middleware/rbac.js";
import { logAction } from "./_logAction.js";

const router = Router();

const renameTagSchema = z.object({ name: z.string().min(1).max(30) });

router.get("/", requireEditor, async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const tags = await prisma.tag.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      include: { _count: { select: { codeTags: true, promptTags: true } } },
      orderBy: { name: "asc" },
      take: 200,
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireEditor, async (req, res, next) => {
  try {
    const { name } = renameTagSchema.parse(req.body);
    const tag = await prisma.tag.update({ where: { id: req.params.id }, data: { name } });
    await logAction(req, "update_tag", "tag", tag.id, { name });
    res.json(tag);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireEditor, async (req, res, next) => {
  try {
    await prisma.tag.delete({ where: { id: req.params.id } });
    await logAction(req, "delete_tag", "tag", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
