import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { apiRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", apiRateLimit, async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findUnique({ where: { id: "singleton" } });
    res.json({
      siteName: settings?.siteName ?? "CodeVault",
      maintenanceMode: settings?.maintenanceMode ?? false,
      allowRegistration: settings?.allowRegistration ?? true,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
