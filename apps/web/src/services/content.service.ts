import { api } from "../lib/api";
import type { Code, Paginated, Prompt, SortOption } from "@codevault/types";

export interface ListParams {
  q?: string;
  language?: string;
  framework?: string;
  category?: string;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

function buildQuery(params: ListParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface CodeInput {
  title: string;
  description: string;
  content: string;
  language: string;
  framework?: string;
  categorySlug?: string;
  projectId?: string;
  libraries?: string[];
  previewImageUrl?: string;
  tags?: string[];
  visibility?: "PUBLIC" | "PRIVATE";
}

export interface PromptInput {
  title: string;
  description: string;
  content: string;
  categorySlug?: string;
  aiModel?: string;
  projectId?: string;
  previewImageUrl?: string;
  tags?: string[];
  variables?: { key: string; label: string; defaultValue?: string }[];
  visibility?: "PUBLIC" | "PRIVATE";
}

export const codesService = {
  list: (params: ListParams) => api.get<Paginated<Code>>(`/codes${buildQuery(params)}`),
  get: (id: string) => api.get<Code & { liked: boolean; saved: boolean }>(`/codes/${id}`),
  create: (data: CodeInput) => api.post<Code>("/codes", data),
  update: (id: string, data: Partial<CodeInput>) => api.patch<Code>(`/codes/${id}`, data),
  remove: (id: string) => api.delete<void>(`/codes/${id}`),
  like: (id: string) => api.post<{ liked: boolean }>(`/codes/${id}/like`),
  save: (id: string) => api.post<{ saved: boolean }>(`/codes/${id}/save`),
  copy: (id: string) => api.post<void>(`/codes/${id}/copy`),
  report: (id: string, reason: string, details?: string) =>
    api.post<void>(`/codes/${id}/report`, { reason, details }),
};

export const promptsService = {
  list: (params: ListParams) => api.get<Paginated<Prompt>>(`/prompts${buildQuery(params)}`),
  get: (id: string) => api.get<Prompt & { liked: boolean; saved: boolean }>(`/prompts/${id}`),
  create: (data: PromptInput) => api.post<Prompt>("/prompts", data),
  update: (id: string, data: Partial<PromptInput>) => api.patch<Prompt>(`/prompts/${id}`, data),
  remove: (id: string) => api.delete<void>(`/prompts/${id}`),
  like: (id: string) => api.post<{ liked: boolean }>(`/prompts/${id}/like`),
  save: (id: string) => api.post<{ saved: boolean }>(`/prompts/${id}/save`),
  copy: (id: string) => api.post<void>(`/prompts/${id}/copy`),
  report: (id: string, reason: string, details?: string) =>
    api.post<void>(`/prompts/${id}/report`, { reason, details }),
};
