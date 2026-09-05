import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { writeRateLimit, apiRateLimit } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import { createProjectSchema, updateProjectSchema } from "../validators/content.validators.js";
import { slugify } from "../lib/slug.js";
import { publicUserSelect } from "../lib/selects.js";
import { canView } from "../lib/visibility.js";

const router = Router();

const contentInclude = {
  tags: { include: { tag: true } },
  category: true,
} as const;

router.get("/", apiRateLimit, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const where = { visibility: "PUBLIC" as const, status: "PUBLISHED" as const };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: { author: { select: publicUserSelect }, _count: { select: { codes: true, prompts: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/:idOrSlug", optionalAuth, async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        author: { select: publicUserSelect },
        codes: { where: { status: "PUBLISHED", visibility: "PUBLIC" }, include: contentInclude },
        prompts: { where: { status: "PUBLISHED", visibility: "PUBLIC" }, include: contentInclude },
      },
    });
    if (!project || !canView(project, req.user)) throw new AppError("المشروع غير موجود.", 404);

    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("EDITOR", "MODERATOR", "ADMIN"), writeRateLimit, async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        previewImageUrl: data.previewImageUrl,
        visibility: data.visibility,
        authorId: req.user!.id,
        slug: slugify(data.title),
      },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("المشروع غير موجود.", 404);
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("لا تملك صلاحية تعديل هذا المشروع.", 403);
    }

    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
        ...(data.previewImageUrl !== undefined ? { previewImageUrl: data.previewImageUrl } : {}),
        ...(data.visibility ? { visibility: data.visibility } : {}),
      },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("المشروع غير موجود.", 404);
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("لا تملك صلاحية حذف هذا المشروع.", 403);
    }
    await prisma.project.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
