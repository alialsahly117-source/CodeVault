import "dotenv/config";
import dns from "node:dns";
import { validateEnv } from "./config/env.js";

// Before anything else imports the app (and with it the JWT secrets and the
// Prisma client) — a bad config should stop the process here, not surface as
// a runtime error on someone's first login.
validateEnv();

// Render's containers can resolve AAAA (IPv6) records for some outbound
// hosts but have no outbound IPv6 route, so a connection that happens to
// pick the IPv6 result hangs and fails with ENETUNREACH/ETIMEDOUT. This
// forces every DNS lookup in the process to prefer IPv4, which actually
// has a route out.
dns.setDefaultResultOrder("ipv4first");

// Imported dynamically so the two lines above run first — a static import
// would be hoisted above them.
const { default: app } = await import("./app.js");

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CodeVault API يعمل على المنفذ ${port}`);
});
