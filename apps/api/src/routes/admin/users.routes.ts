import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin, requireModerator } from "../../middleware/rbac.js";
import { AppError } from "../../middleware/errorHandler.js";
import { changeRoleSchema, banUserSchema } from "../../validators/admin.validators.js";
import { logAction } from "./_logAction.js";

const router = Router();

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { profile: { displayName: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/role", requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user!.id) throw new AppError("لا يمكنك تغيير صلاحيتك الخاصة.", 400);
    const { role } = changeRoleSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    await logAction(req, "change_role", "user", user.id, { role });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Suspend/ban/reactivate — moderators can act on abusive users, only admins can manage roles.
router.patch("/:id/status", requireModerator, async (req, res, next) => {
  try {
    if (req.params.id === req.user!.id) throw new AppError("لا يمكنك تغيير حالة حسابك الخاص.", 400);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError("المستخدم غير موجود.", 404);
    if ((target.role === "ADMIN" || target.role === "MODERATOR") && req.user!.role !== "ADMIN") {
      throw new AppError("لا يمكن لمشرف المراجعة تعديل حالة مشرف آخر.", 403);
    }
    const { status } = banUserSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
    await logAction(req, "change_status", "user", user.id, { status });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user!.id) throw new AppError("لا يمكنك حذف حسابك الخاص.", 400);
    await prisma.user.delete({ where: { id: req.params.id } });
    await logAction(req, "delete_user", "user", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
