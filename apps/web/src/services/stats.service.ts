import { api } from "../lib/api";

export interface PublicStats {
  codes: number;
  prompts: number;
  users: number;
  categories: number;
}

export const statsService = {
  get: () => api.get<PublicStats>("/stats"),
};
