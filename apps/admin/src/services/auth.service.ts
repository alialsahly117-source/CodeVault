import type { User } from "@codevault/types";
import { api } from "../lib/api";

export const authService = {
  me: () => api.get<User>("/auth/me"),
  login: (email: string, password: string) =>
    api.post<{ id: string; email: string; role: string }>("/auth/login", { email, password }),
  logout: () => api.post<void>("/auth/logout"),
};
