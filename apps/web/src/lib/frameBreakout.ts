import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Takes the visitor out of an embedding frame before they authenticate.
 *
 * novatech.ly embeds this site as a live preview of the platform (see the
 * frame-ancestors allow-list in apps/web/netlify.toml). Browsing inside that
 * frame is fine. Signing in is not:
 *
 *   - Session cookies are third-party inside another origin's document, so
 *     browsers restrict or drop them and a login can appear to succeed and
 *     then quietly not hold.
 *   - Password managers distrust framed login forms and often refuse to
 *     fill them, pushing people into typing credentials by hand.
 *   - A framed login form is the textbook clickjacking target, which is the
 *     reason frame-ancestors is otherwise locked down.
 *
 * This guards the ROUTE, not the click. The auth controls in the navbar are
 * buttons calling `navigate("/login")`, not anchors, so a click-on-link
 * interceptor never sees them — and neither would it see a redirect from
 * ProtectedRoute or a pasted URL. Watching the resolved location catches
 * every one of those paths.
 */

const AUTH_ROUTES = /^\/(login|register|forgot-password|reset-password)(\/|$)/;

/** True when this document is not the top-level one. */
function isFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // A cross-origin parent makes reading window.top throw, which is itself
    // proof that we are framed by someone else.
    return true;
  }
}

export function useFrameBreakout(): void {
  const location = useLocation();

  useEffect(() => {
    if (!isFramed()) return;
    if (!AUTH_ROUTES.test(location.pathname)) return;

    const target = `${window.location.origin}${location.pathname}${location.search}`;

    // Top navigation needs allow-top-navigation-by-user-activation on the
    // embedding iframe; arriving here from a click satisfies the activation
    // requirement. If the embedder has not granted it, open a new tab so the
    // visitor still reaches a first-party login instead of a dead end.
    try {
      window.top!.location.href = target;
    } catch {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  }, [location.pathname, location.search]);
}
