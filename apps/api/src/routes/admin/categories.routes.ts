import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireEditor } from "../../middleware/rbac.js";
import { upsertCategorySchema } from "../../validators/admin.validators.js";
import { slugify } from "../../lib/slug.js";
import { logAction } from "./_logAction.js";

const router = Router();

router.get("/", requireEditor, async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { codes: true, prompts: true } } },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireEditor, async (req, res, next) => {
  try {
    const data = upsertCategorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { name: data.name, type: data.type, slug: slugify(data.name), parentId: data.parentId || undefined },
    });
    await logAction(req, "create_category", "category", category.id);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireEditor, async (req, res, next) => {
  try {
    const data = upsertCategorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId || null } : {}),
      },
    });
    await logAction(req, "update_category", "category", category.id);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireEditor, async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    await logAction(req, "delete_category", "category", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
