import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireEditor } from "../../middleware/rbac.js";
import { publicUserSelect } from "../../lib/selects.js";

const router = Router();

router.get("/stats", requireEditor, async (_req, res, next) => {
  try {
    const [users, codes, prompts, categories, likes, copyEvents, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.code.count(),
      prisma.prompt.count(),
      prisma.category.count(),
      prisma.like.count(),
      prisma.copyEvent.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);
    res.json({
      totalUsers: users,
      totalCodes: codes,
      totalPrompts: prompts,
      totalCategories: categories,
      totalLikes: likes,
      totalCopies: copyEvents,
      pendingReports,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/activity", requireEditor, async (_req, res, next) => {
  try {
    const [codes, prompts, logs] = await Promise.all([
      prisma.code.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { author: { select: publicUserSelect } },
      }),
      prisma.prompt.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { author: { select: publicUserSelect } },
      }),
      prisma.adminLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: publicUserSelect } },
      }),
    ]);

    const ACTION_LABELS: Record<string, string> = {
      change_role: "غيّر صلاحية مستخدم",
      change_status: "غيّر حالة مستخدم",
      delete_user: "حذف مستخدمًا",
      moderate_code: "راجع حالة كود",
      delete_code: "حذف كودًا",
      moderate_prompt: "راجع حالة برومبت",
      delete_prompt: "حذف برومبتًا",
      create_category: "أضاف تصنيفًا",
      update_category: "عدّل تصنيفًا",
      delete_category: "حذف تصنيفًا",
      update_tag: "عدّل وسمًا",
      delete_tag: "حذف وسمًا",
      update_report: "حدّث حالة بلاغ",
      update_settings: "غيّر إعدادات النظام",
      login: "سجّل الدخول",
      logout: "سجّل الخروج",
    };

    const items = [
      ...codes.map((c) => ({
        id: `code-${c.id}`,
        type: "code" as const,
        text: `${c.author?.profile?.displayName || "مستخدم"} أضاف كودًا جديدًا: ${c.title}`,
        createdAt: c.createdAt,
      })),
      ...prompts.map((p) => ({
        id: `prompt-${p.id}`,
        type: "prompt" as const,
        text: `${p.author?.profile?.displayName || "مستخدم"} نشر برومبتًا: ${p.title}`,
        createdAt: p.createdAt,
      })),
      ...logs.map((l) => ({
        id: `log-${l.id}`,
        type: "admin_log" as const,
        text: `${l.admin?.profile?.displayName || "مشرف"} ${ACTION_LABELS[l.action] || l.action}`,
        createdAt: l.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
