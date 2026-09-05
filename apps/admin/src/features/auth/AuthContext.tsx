import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@codevault/types";
import { authService } from "../../services/auth.service";
import { ApiError } from "../../lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Any non-USER role — the minimum bar to even look at the dashboard shell. */
  isStaff: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  /**
   * Resolves only once fresh data has actually landed — callers that
   * navigate right after (e.g. LoginPage) must await this, or RequireStaff
   * can still see the stale pre-login `isAuthenticated: false` on the very
   * next render and bounce straight back to /login before the real answer
   * arrives.
   */
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    retry: false,
    staleTime: 30_000,
    throwOnError: (err) => !(err instanceof ApiError && err.status === 401),
  });

  const role = data?.role;

  const value: AuthContextValue = {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    isStaff: !!role && role !== "USER",
    isAdmin: role === "ADMIN",
    isModerator: role === "ADMIN" || role === "MODERATOR",
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    logout: async () => {
      await authService.logout();
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
