import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import dashboardRoutes from "./dashboard.routes.js";
import usersRoutes from "./users.routes.js";
import contentRoutes from "./content.routes.js";
import categoriesRoutes from "./categories.routes.js";
import tagsRoutes from "./tags.routes.js";
import reportsRoutes from "./reports.routes.js";
import settingsRoutes from "./settings.routes.js";
import logsRoutes from "./logs.routes.js";

const router = Router();

// Every route below additionally enforces its own role via requireAdmin /
// requireModerator / requireEditor — requireAuth here only establishes identity.
router.use(requireAuth);

router.use("/", dashboardRoutes);
router.use("/users", usersRoutes);
router.use("/", contentRoutes);
router.use("/categories", categoriesRoutes);
router.use("/tags", tagsRoutes);
router.use("/reports", reportsRoutes);
router.use("/settings", settingsRoutes);
router.use("/logs", logsRoutes);

export default router;
