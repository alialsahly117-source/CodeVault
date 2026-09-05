/**
 * Fail-fast configuration check, run once at startup before the server binds.
 *
 * Without this, a deploy missing JWT_ACCESS_SECRET doesn't fail at boot — it
 * boots "fine" and then throws on the first login attempt, or worse, a
 * placeholder secret ships to production unnoticed. A misconfigured process
 * should refuse to start rather than serve traffic in a broken or weakened
 * state.
 */
const MIN_SECRET_LENGTH = 32;

export function validateEnv() {
  const problems: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL مفقود.");
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const twoFactorKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;

  for (const [name, value] of [
    ["JWT_ACCESS_SECRET", accessSecret],
    ["JWT_REFRESH_SECRET", refreshSecret],
    ["TWO_FACTOR_ENCRYPTION_KEY", twoFactorKey],
  ] as const) {
    if (!value) {
      problems.push(`${name} مفقود.`);
    } else if (value.length < MIN_SECRET_LENGTH) {
      problems.push(`${name} قصير جدًا (يجب ${MIN_SECRET_LENGTH} حرفًا على الأقل).`);
    }
  }

  // Reusing one secret for both tokens means a leaked access token can be
  // replayed as a refresh token, collapsing the short/long-lived split.
  if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
    problems.push("JWT_ACCESS_SECRET و JWT_REFRESH_SECRET متطابقان — يجب أن يكونا مختلفين.");
  }

  if (isProduction) {
    if (process.env.COOKIE_SECURE !== "true") {
      problems.push("COOKIE_SECURE يجب أن يكون \"true\" في الإنتاج.");
    }
    if (!process.env.WEB_URL) {
      problems.push("WEB_URL مفقود — بدونه لن تعمل CORS ولا روابط إعادة تعيين كلمة المرور.");
    }
  }

  if (problems.length > 0) {
    const message = ["إعدادات البيئة غير صالحة — لن يبدأ الخادم:", ...problems.map((p) => `  - ${p}`)].join("\n");
    throw new Error(message);
  }
}
