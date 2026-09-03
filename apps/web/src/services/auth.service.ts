import { api } from "../lib/api";
import type { User } from "@codevault/types";

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  me: () => api.get<User>("/auth/me"),
  register: (data: RegisterInput) => api.post<{ id: string; email: string; role: string }>("/auth/register", data),
  login: (data: LoginInput) => api.post<{ id: string; email: string; role: string }>("/auth/login", data),
  logout: () => api.post<void>("/auth/logout"),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, password }),
  updateProfile: (data: { displayName?: string; bio?: string; avatarUrl?: string }) =>
    api.patch<User["profile"]>("/auth/me", data),
};
