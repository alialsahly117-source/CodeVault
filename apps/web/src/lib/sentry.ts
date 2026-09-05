import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/** No-op (and no network setup at all) when VITE_SENTRY_DSN is unset — local dev stays unreported. */
export function initSentry() {
  if (!dsn) return;
  Sentry.init({ dsn, environment: import.meta.env.MODE });
}

export { Sentry };
