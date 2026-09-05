import rateLimit from "express-rate-limit";

// The test suite legitimately makes far more auth/write calls in a few
// seconds than any real client would in the actual rate-limit window —
// without this the limiters themselves would make the test run flaky.
const isTest = process.env.NODE_ENV === "test";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 100_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "محاولات كثيرة جدًا. الرجاء المحاولة لاحقًا." },
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 100_000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "طلبات كثيرة جدًا. الرجاء المحاولة لاحقًا." },
});

export const writeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 100_000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "طلبات كثيرة جدًا. الرجاء المحاولة لاحقًا." },
});
