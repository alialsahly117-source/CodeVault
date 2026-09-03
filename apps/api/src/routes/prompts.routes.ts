import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth.js";
import { writeRateLimit, apiRateLimit } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import { createPromptSchema, updatePromptSchema, listQuerySchema, reportSchema } from "../validators/content.validators.js";
import { slugify } from "../lib/slug.js";
import { publicUserSelect } from "../lib/selects.js";

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
    if (query.category) where.category = { slug: query.category };

    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
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
      prisma.prompt.count({ where }),
    ]);

    res.json({ items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: req.params.id },
      include: { tags: { include: { tag: true } }, category: true, project: true, author: { select: publicUserSelect } },
    });
    if (!prompt || prompt.status !== "PUBLISHED") throw new AppError("البرومبت غير موجود.", 404);
    if (prompt.visibility === "PRIVATE" && prompt.authorId !== req.user?.id && req.user?.role !== "ADMIN") {
      throw new AppError("البرومبت غير موجود.", 404);
    }

    await prisma.prompt.update({ where: { id: prompt.id }, data: { viewCount: { increment: 1 } } });

    let liked = false;
    let saved = false;
    if (req.user) {
      const [likeRow, saveRow] = await Promise.all([
        prisma.like.findFirst({ where: { userId: req.user.id, promptId: prompt.id } }),
        prisma.savedItem.findFirst({ where: { userId: req.user.id, promptId: prompt.id } }),
      ]);
      liked = !!likeRow;
      saved = !!saveRow;
    }

    res.json({ ...prompt, liked, saved });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("EDITOR", "MODERATOR", "ADMIN"), writeRateLimit, async (req, res, next) => {
  try {
    const data = createPromptSchema.parse(req.body);
    const category = data.categorySlug
      ? await prisma.category.findUnique({ where: { slug: data.categorySlug } })
      : null;

    const prompt = await prisma.prompt.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        aiModel: data.aiModel,
        previewImageUrl: data.previewImageUrl,
        variables: data.variables ?? undefined,
        projectId: data.projectId || undefined,
        visibility: data.visibility,
        authorId: req.user!.id,
        categoryId: category?.id,
        tags: { create: await connectTags(data.tags) },
      },
      include: { tags: { include: { tag: true } }, category: true, project: true },
    });

    res.status(201).json(prompt);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const existing = await prisma.prompt.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("البرومبت غير موجود.", 404);
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("لا تملك صلاحية تعديل هذا البرومبت.", 403);
    }

    const data = updatePromptSchema.parse(req.body);
    const category = data.categorySlug
      ? await prisma.category.findUnique({ where: { slug: data.categorySlug } })
      : undefined;

    const updateData: Prisma.PromptUncheckedUpdateInput = {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.content ? { content: data.content } : {}),
      ...(data.aiModel !== undefined ? { aiModel: data.aiModel } : {}),
      ...(data.previewImageUrl !== undefined ? { previewImageUrl: data.previewImageUrl } : {}),
      ...(data.variables !== undefined ? { variables: data.variables ?? Prisma.JsonNull } : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId || null } : {}),
      ...(data.visibility ? { visibility: data.visibility } : {}),
      ...(category !== undefined ? { categoryId: category?.id ?? null } : {}),
      ...(data.tags ? { tags: { deleteMany: {}, create: await connectTags(data.tags) } } : {}),
    };

    const prompt = await prisma.prompt.update({
      where: { id: existing.id },
      data: updateData,
      include: { tags: { include: { tag: true } }, category: true, project: true },
    });

    res.json(prompt);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const existing = await prisma.prompt.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("البرومبت غير موجود.", 404);
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("لا تملك صلاحية حذف هذا البرومبت.", 403);
    }
    await prisma.prompt.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/like", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const promptId = req.params.id;
    const existing = await prisma.like.findFirst({ where: { userId: req.user!.id, promptId } });
    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.prompt.update({ where: { id: promptId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return res.json({ liked: false });
    }
    await prisma.$transaction([
      prisma.like.create({ data: { userId: req.user!.id, promptId, itemType: "PROMPT" } }),
      prisma.prompt.update({ where: { id: promptId }, data: { likeCount: { increment: 1 } } }),
    ]);
    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/save", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const promptId = req.params.id;
    const existing = await prisma.savedItem.findFirst({ where: { userId: req.user!.id, promptId } });
    if (existing) {
      await prisma.savedItem.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    }
    await prisma.savedItem.create({ data: { userId: req.user!.id, promptId, itemType: "PROMPT" } });
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/copy", optionalAuth, writeRateLimit, async (req, res, next) => {
  try {
    const promptId = req.params.id;
    await prisma.$transaction([
      prisma.copyEvent.create({ data: { promptId, itemType: "PROMPT", userId: req.user?.id } }),
      prisma.prompt.update({ where: { id: promptId }, data: { copyCount: { increment: 1 } } }),
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/report", requireAuth, writeRateLimit, async (req, res, next) => {
  try {
    const { reason, details } = reportSchema.parse(req.body);
    const report = await prisma.report.create({
      data: { reporterId: req.user!.id, promptId: req.params.id, itemType: "PROMPT", reason, details },
    });
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
