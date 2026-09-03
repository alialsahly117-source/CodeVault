import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";
import type { User } from "@codevault/types";
import { ApiError } from "../../lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True for EDITOR/MODERATOR/ADMIN — used only to surface a link out to the separate admin app. */
  isStaff: boolean;
  refetch: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    retry: false,
    staleTime: 60_000,
    // Avoid noisy console errors for anonymous visitors (401 is expected).
    throwOnError: (err) => !(err instanceof ApiError && err.status === 401),
  });

  const value: AuthContextValue = {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    isStaff: !!data && data.role !== "USER",
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      refetch();
    },
    logout: async () => {
      await authService.logout();
      // Set the cache straight to null instead of waiting on a refetch —
      // the user should see the logged-out state the instant they click,
      // not after a round trip (or a manual page reload).
      queryClient.setQueryData(["auth", "me"], null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  return ctx;
}
