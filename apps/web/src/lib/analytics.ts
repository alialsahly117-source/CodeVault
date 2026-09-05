const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

/** Loads gtag.js once. No-op (and no network request) when VITE_GA_MEASUREMENT_ID is unset — local dev stays untracked. */
export function initAnalytics() {
  if (!GA_ID || initialized) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  // send_page_view disabled: this is an SPA, so we send page_view ourselves
  // on every route change instead (see trackPageView) rather than only once
  // on the initial full page load.
  window.gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path });
}
