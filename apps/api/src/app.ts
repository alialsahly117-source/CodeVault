import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRateLimit } from "./middleware/rateLimit.js";

import authRoutes from "./routes/auth.routes.js";
import codesRoutes from "./routes/codes.routes.js";
import promptsRoutes from "./routes/prompts.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import searchRoutes from "./routes/search.routes.js";
import usersRoutes from "./routes/users.routes.js";
import adminRoutes from "./routes/admin/index.js";
import statsRoutes from "./routes/stats.routes.js";
import publicSettingsRoutes from "./routes/publicSettings.routes.js";

const app = express();

// The public site (WEB_URL) and the admin dashboard (ADMIN_URL) are separate
// origins/apps hitting this same API — both must be allowed with credentials.
const allowedOrigins = [process.env.WEB_URL, process.env.ADMIN_URL, process.env.CLIENT_URL].filter(
  (v): v is string => !!v
);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/codes", codesRoutes);
app.use("/api/prompts", promptsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/search", apiRateLimit, searchRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/settings", publicSettingsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
