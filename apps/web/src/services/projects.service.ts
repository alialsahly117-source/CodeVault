import { api } from "../lib/api";
import type { Paginated, Project } from "@codevault/types";

export interface ProjectInput {
  title: string;
  description: string;
  instructions?: string;
  previewImageUrl?: string;
  visibility?: "PUBLIC" | "PRIVATE";
}

export const projectsService = {
  list: (params: { page?: number; limit?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return api.get<Paginated<Project>>(`/projects${qs ? `?${qs}` : ""}`);
  },
  get: (idOrSlug: string) => api.get<Project>(`/projects/${idOrSlug}`),
  create: (data: ProjectInput) => api.post<Project>("/projects", data),
  update: (id: string, data: Partial<ProjectInput>) => api.patch<Project>(`/projects/${id}`, data),
  remove: (id: string) => api.delete<void>(`/projects/${id}`),
};
