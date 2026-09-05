import dotenv from "dotenv";

// Loaded before any test file's own imports run (vitest setupFiles), so
// lib/prisma.ts's module-level `new PrismaClient()` and jwt.ts's module-level
// secret reads see the test database and test secrets, never the real ones.
dotenv.config({ path: ".env.test", override: true });
