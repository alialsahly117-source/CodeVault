import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireModerator } from "../../middleware/rbac.js";
import { AppError } from "../../middleware/errorHandler.js";
import { reportStatusSchema } from "../../validators/admin.validators.js";
import { logAction } from "./_logAction.js";

const router = Router();

router.get("/", requireModerator, async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const reports = await prisma.report.findMany({
      where: status ? { status: status as never } : {},
      include: { reporter: { include: { profile: true } }, code: true, prompt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireModerator, async (req, res, next) => {
  try {
    const { status } = reportStatusSchema.parse(req.body);
    const report = await prisma.report.update({ where: { id: req.params.id }, data: { status } });
    await logAction(req, "update_report", "report", report.id, { status });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// Compound moderation action: hide the reported content and mark the report resolved.
router.post("/:id/hide-content", requireModerator, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new AppError("البلاغ غير موجود.", 404);

    if (report.itemType === "CODE" && report.codeId) {
      await prisma.code.update({ where: { id: report.codeId }, data: { status: "HIDDEN" } });
      await logAction(req, "moderate_code", "code", report.codeId, { status: "HIDDEN", viaReport: report.id });
    } else if (report.itemType === "PROMPT" && report.promptId) {
      await prisma.prompt.update({ where: { id: report.promptId }, data: { status: "HIDDEN" } });
      await logAction(req, "moderate_prompt", "prompt", report.promptId, { status: "HIDDEN", viaReport: report.id });
    }

    const updated = await prisma.report.update({ where: { id: report.id }, data: { status: "ACTION_TAKEN" } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Compound moderation action: delete the reported content and mark the report resolved.
router.post("/:id/delete-content", requireModerator, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new AppError("البلاغ غير موجود.", 404);

    if (report.itemType === "CODE" && report.codeId) {
      await prisma.code.delete({ where: { id: report.codeId } }).catch(() => null);
      await logAction(req, "delete_code", "code", report.codeId, { viaReport: report.id });
    } else if (report.itemType === "PROMPT" && report.promptId) {
      await prisma.prompt.delete({ where: { id: report.promptId } }).catch(() => null);
      await logAction(req, "delete_prompt", "prompt", report.promptId, { viaReport: report.id });
    }

    const updated = await prisma.report.update({ where: { id: report.id }, data: { status: "ACTION_TAKEN" } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Compound moderation action: ban the reported item's author and mark the report resolved.
router.post("/:id/ban-user", requireModerator, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { code: true, prompt: true },
    });
    if (!report) throw new AppError("البلاغ غير موجود.", 404);

    const authorId = report.code?.authorId || report.prompt?.authorId;
    if (!authorId) throw new AppError("تعذر تحديد صاحب المحتوى المُبلَّغ عنه.", 400);
    if (authorId === req.user!.id) throw new AppError("لا يمكنك حظر نفسك.", 400);

    const target = await prisma.user.findUnique({ where: { id: authorId } });
    if (target && (target.role === "ADMIN" || target.role === "MODERATOR") && req.user!.role !== "ADMIN") {
      throw new AppError("لا يمكن لمشرف المراجعة حظر مشرف آخر.", 403);
    }

    await prisma.user.update({ where: { id: authorId }, data: { status: "BANNED" } });
    await logAction(req, "change_status", "user", authorId, { status: "BANNED", viaReport: report.id });

    const updated = await prisma.report.update({ where: { id: report.id }, data: { status: "ACTION_TAKEN" } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
