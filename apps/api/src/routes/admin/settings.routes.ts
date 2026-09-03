import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin } from "../../middleware/rbac.js";
import { logAction } from "./_logAction.js";

const router = Router();

const settingsSchema = z.object({
  siteName: z.string().min(1).max(60).optional(),
  maintenanceMode: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
});

async function getOrCreateSettings() {
  return prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await getOrCreateSettings());
  } catch (err) {
    next(err);
  }
});

router.patch("/", requireAdmin, async (req, res, next) => {
  try {
    const data = settingsSchema.parse(req.body);
    await getOrCreateSettings();
    const updated = await prisma.setting.update({ where: { id: "singleton" }, data });
    await logAction(req, "update_settings", "settings", "singleton", data);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
