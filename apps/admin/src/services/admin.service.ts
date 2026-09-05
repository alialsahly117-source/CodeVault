import type {
  AdminLog,
  AdminReport,
  AdminStats,
  Category,
  Code,
  ContentStatus,
  Paginated,
  Prompt,
  ReportStatus,
  Role,
  SiteSettings,
  Tag,
  User,
  UserStatus,
  ActivityItem,
} from "@codevault/types";
import { api } from "../lib/api";

export const adminService = {
  stats: () => api.get<AdminStats>("/admin/stats"),
  activity: () => api.get<ActivityItem[]>("/admin/activity"),

  users: (q = "", page = 1) => api.get<Paginated<User>>(`/admin/users?q=${encodeURIComponent(q)}&page=${page}`),
  changeRole: (id: string, role: Role) => api.patch<User>(`/admin/users/${id}/role`, { role }),
  changeStatus: (id: string, status: UserStatus) => api.patch<User>(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: string) => api.delete<void>(`/admin/users/${id}`),

  codes: (page = 1, status = "") =>
    api.get<Paginated<Code>>(`/admin/codes?page=${page}${status ? `&status=${status}` : ""}`),
  moderateCode: (id: string, status: ContentStatus) => api.patch<Code>(`/admin/codes/${id}/status`, { status }),
  deleteCode: (id: string) => api.delete<void>(`/admin/codes/${id}`),

  prompts: (page = 1, status = "") =>
    api.get<Paginated<Prompt>>(`/admin/prompts?page=${page}${status ? `&status=${status}` : ""}`),
  moderatePrompt: (id: string, status: ContentStatus) => api.patch<Prompt>(`/admin/prompts/${id}/status`, { status }),
  deletePrompt: (id: string) => api.delete<void>(`/admin/prompts/${id}`),

  categories: () => api.get<Category[]>("/admin/categories"),
  createCategory: (data: { name: string; type: string; parentId?: string | null }) =>
    api.post<Category>("/admin/categories", data),
  updateCategory: (id: string, data: Partial<{ name: string; type: string; parentId?: string | null }>) =>
    api.patch<Category>(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<void>(`/admin/categories/${id}`),

  tags: (q = "") => api.get<Tag[]>(`/admin/tags?q=${encodeURIComponent(q)}`),
  renameTag: (id: string, name: string) => api.patch<Tag>(`/admin/tags/${id}`, { name }),
  deleteTag: (id: string) => api.delete<void>(`/admin/tags/${id}`),

  reports: (status?: string) => api.get<AdminReport[]>(`/admin/reports${status ? `?status=${status}` : ""}`),
  updateReportStatus: (id: string, status: ReportStatus) =>
    api.patch<AdminReport>(`/admin/reports/${id}/status`, { status }),
  hideReportedContent: (id: string) => api.post<AdminReport>(`/admin/reports/${id}/hide-content`),
  deleteReportedContent: (id: string) => api.post<void>(`/admin/reports/${id}/delete-content`),
  banReportedUser: (id: string) => api.post<AdminReport>(`/admin/reports/${id}/ban-user`),

  settings: () => api.get<SiteSettings>("/admin/settings"),
  updateSettings: (data: Partial<SiteSettings>) => api.patch<SiteSettings>("/admin/settings", data),

  logs: (page = 1) => api.get<Paginated<AdminLog>>(`/admin/logs?page=${page}`),
};
