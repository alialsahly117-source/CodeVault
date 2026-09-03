import "dotenv/config";
import dns from "node:dns";
import app from "./app.js";

// Render's containers resolve AAAA (IPv6) records for hosts like
// smtp.gmail.com but have no outbound IPv6 route, so any connection that
// happens to pick the IPv6 result hangs and fails with ENETUNREACH/ETIMEDOUT.
// This forces every DNS lookup in the process (not just nodemailer's) to
// prefer IPv4, which is what actually has a route out.
dns.setDefaultResultOrder("ipv4first");

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CodeVault API يعمل على المنفذ ${port}`);
});
