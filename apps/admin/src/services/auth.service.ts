import type { User } from "@codevault/types";
import { api } from "../lib/api";

export interface LoginResult {
  id?: string;
  email?: string;
  role?: string;
  requiresTwoFactor?: boolean;
  pendingToken?: string;
}

export const authService = {
  me: () => api.get<User>("/auth/me"),
  login: (email: string, password: string) => api.post<LoginResult>("/auth/login", { email, password }),
  logout: () => api.post<void>("/auth/logout"),

  twoFactorLogin: (pendingToken: string, token: string) =>
    api.post<LoginResult>("/auth/2fa/login", { pendingToken, token }),
  twoFactorSetup: () => api.post<{ secret: string; qrCodeDataUrl: string }>("/auth/2fa/setup"),
  twoFactorEnable: (secret: string, token: string) =>
    api.post<{ backupCodes: string[] }>("/auth/2fa/enable", { secret, token }),
  twoFactorDisable: (password: string | undefined, token: string) =>
    api.post<void>("/auth/2fa/disable", { password, token }),
};
