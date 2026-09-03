import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Front-door gate for the whole dashboard. This is a UX convenience only —
 * every admin API endpoint re-checks the caller's role on the backend
 * regardless of what this component decides to render.
 */
export function RequireStaff() {
  const { isLoading, isAuthenticated, isStaff } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isLoading, isAdmin } = useAuth();
  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}

export function RequireModerator() {
  const { isLoading, isModerator } = useAuth();
  if (isLoading) return null;
  if (!isModerator) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
