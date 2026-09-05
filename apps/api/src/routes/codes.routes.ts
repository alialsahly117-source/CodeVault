import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { writeRateLimit, apiRateLimit } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import { createCodeSchema, updateCodeSchema, listQuerySchema, reportSchema } from "../validators/content.validators.js";
import { slugify } from "../lib/slug.js";
import { publicUserSelect } from "../lib/selects.js";
import { canView } from "../lib/visibility.js";

async function requireVisibleCode(codeId: string, user?: { id: string; role: string }) {
  const code = await prisma.code.findUnique({
    where: { id: codeId },
    select: { id: true, authorId: true, visibility: true, status: true },
  });
  if (!code || !canView(code, user)) throw new AppError("الكود غير موجود.", 404);
  return code;
}

const router = Router();

const SORTS: Record<string, object> = {
  newest: { createdAt: "desc" },
  most_copied: { copyCount: "desc" },
  most_used: { copyCount: "desc" },
  most_liked: { likeCount: "desc" },
  top_rated: { likeCount: "desc" },
};

async function connectTags(names: string[] | undefined) {
  if (!names?.length) return [];
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const tags = await Promise.all(
    unique.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      })
    )
  );
  return tags.map((t) => ({ tagId: t.id }));
}

router.get("/", apiRateLimit, async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const where: Record<string, unknown> = { visibility: "PUBLIC", status: "PUBLISHED" };
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { content: { contains: query.q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: query.q, mode: "insensitive" } } } } },
      ];
    }
    if (query.language) where.language = { equals: query.language, mode: "insensitive" };
    if (query.framework) where.framework = { equals: query.framework, mode: "insensitive" };
    if (query.category) where.category = { slug: query.category };

    const [items, total] = await Promise.all([
      prisma.code.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          category: true,
          project: true,
          author: { select: publicUserSelect },
        },
        orderBy: SORTS[query.sort || "newest"] as never,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.code.count({ where }),
    ]);

    res.json({ items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const code = await prisma.code.findUnique({
      where: { id: req.params.id },
      include: { tags: { include: { tag: true } }, category: true, project: true, author: { select: publicUserSelect } },
    });
    if (!code || code.status !== "PUBLISHED") throw new AppError("الكود غير موجود.", 404);
    if (code.visibility === "PRIVATE" && code.authorId !== req.user?.id && req.user?.role !== "ADMIN") {
      throw new AppError("الكود غير موجود.", 404);
    }

    await prisma.code.update({ where: { id: code.id }, data: { viewCount: { increment: 1 } } });

    let liked = false;
    let saved = false;
    if (req.user) {
      const [likeRow, saveRow] = await Promise.all([
        prisma.like.findFirst({ where: { userId: req.user.id, codeId: code.id } }),
        prisma.savedItem.findFirst({ where: { userId: req.user.id, codeId: code.id } }),
      ]);
      liked = !!likeRow;
      saved = !!saveRow;
    }

    res.json({ ...code, liked, saved });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("EDITOR", "MODERATOR", "ADMIN"), writeRateLimit, async (req, res, next) => {
  try {
    const data = createCodeSchema.parse(req.body);
    const category = data.categorySlug
      ? await prisma.category.findUnique({ where: { slug: data.categorySlug } })
      : null;

    const code = await prisma.code.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        language: data.language,
        framework: data.framework,
        previewImageUrl: data.previewImageUrl,
        libraries: data.libraries?.length ? data.libraries : undefined,
        projectId: data.projectId || undefined,
        visibility: data.visibility,
        authorId: req.user!.id,
        categoryId: category?.id,
        tags: { create: await connectTags(data.tags) },
      },
      include: { tags: { include: { tag: true } }, category: true, project: true },
    });

    res.status(201).json(code);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const existing = await prisma.code.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("الكود غير موجود.", 404);
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("لا تملك صلاحية تعديل هذا الكود.", 403);
    }

    const data = updateCodeSchema.parse(req.body);
    const category = data.categorySlug
      ? await prisma.category.findUnique({ where: { slug: data.categorySlug } })
      : undefined;

    const updateData: Prisma.CodeUncheckedUpdateInput = {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.content ? { content: data.content } : {}),
      ...(data.language ? { language: data.language } : {}),
      ...(data.framework !== undefined ? { framework: data.framework } : {}),
      ...(data.previewImageUrl !== undefined ? { previewImageUrl: data.previewImageUrl } : {}),
      ...(data.libraries !== undefined
        ? { libraries: data.libraries.length ? data.libraries : Prisma.JsonNull }
        : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId || null } : {}),
      ...(data.visibility ? { visibility: data.visibility } : {}),
      ...(category !== undefined ? { categoryId: category?.id ?? null } : {}),
      ...(data.tags ? { tags: { deleteMany: {}, create: await connectTags(data.tags) } } : {}),
    };

    const code = await prisma.code.update({
      where: { id: existing.id },
      data: updateData,
      include: { tags: { include: { tag: true } }, category: true, project: true },
    });

    res.json(code);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const existing = await prisma.code.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("الكود غير موجود.", 404);
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("لا تملك صلاحية حذف هذا الكود.", 403);
    }
    await prisma.code.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/like", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const codeId = req.params.id;
    await requireVisibleCode(codeId, req.user);
    const existing = await prisma.like.findFirst({ where: { userId: req.user!.id, codeId } });
    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.code.update({ where: { id: codeId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return res.json({ liked: false });
    }
    await prisma.$transaction([
      prisma.like.create({ data: { userId: req.user!.id, codeId, itemType: "CODE" } }),
      prisma.code.update({ where: { id: codeId }, data: { likeCount: { increment: 1 } } }),
    ]);
    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/save", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const codeId = req.params.id;
    await requireVisibleCode(codeId, req.user);
    const existing = await prisma.savedItem.findFirst({ where: { userId: req.user!.id, codeId } });
    if (existing) {
      await prisma.savedItem.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    }
    await prisma.savedItem.create({ data: { userId: req.user!.id, codeId, itemType: "CODE" } });
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/copy", optionalAuth, writeRateLimit, async (req, res, next) => {
  try {
    const codeId = req.params.id;
    await requireVisibleCode(codeId, req.user);
    await prisma.$transaction([
      prisma.copyEvent.create({ data: { codeId, itemType: "CODE", userId: req.user?.id } }),
      prisma.code.update({ where: { id: codeId }, data: { copyCount: { increment: 1 } } }),
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/report", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    await requireVisibleCode(req.params.id, req.user);
    const { reason, details } = reportSchema.parse(req.body);
    const report = await prisma.report.create({
      data: { reporterId: req.user!.id, codeId: req.params.id, itemType: "CODE", reason, details },
    });
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
