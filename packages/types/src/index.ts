export type Role = "USER" | "EDITOR" | "MODERATOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type Visibility = "PUBLIC" | "PRIVATE";
export type ContentStatus = "PUBLISHED" | "HIDDEN" | "PENDING";
export type ItemType = "CODE" | "PROMPT";
export type ReportReason = "SPAM" | "MALICIOUS_CODE" | "COPYRIGHT" | "INAPPROPRIATE" | "OTHER";
export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";
export type CategoryType = "PROGRAMMING" | "AI" | "PROMPT_TYPE" | "GENERAL";
export type SortOption = "newest" | "most_copied" | "most_used" | "most_liked" | "top_rated";

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  status?: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  profile: Profile | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId?: string | null;
  children?: Category[];
  _count?: { codes: number; prompts: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { codeTags: number; promptTags: number };
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions?: string | null;
  previewImageUrl?: string | null;
  authorId: string;
  author?: User;
  visibility: Visibility;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  codes?: Code[];
  prompts?: Prompt[];
  _count?: { codes: number; prompts: number };
}

export interface Code {
  id: string;
  title: string;
  description: string;
  content: string;
  language: string;
  framework?: string | null;
  previewImageUrl?: string | null;
  libraries?: string[] | null;
  categoryId?: string | null;
  category?: Category | null;
  projectId?: string | null;
  project?: Project | null;
  authorId: string;
  author?: User;
  visibility: Visibility;
  status: ContentStatus;
  copyCount: number;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tags: { tag: Tag }[];
  liked?: boolean;
  saved?: boolean;
}

export interface PromptVariable {
  key: string;
  label: string;
  defaultValue?: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  categoryId?: string | null;
  category?: Category | null;
  aiModel?: string | null;
  previewImageUrl?: string | null;
  variables?: PromptVariable[] | null;
  projectId?: string | null;
  project?: Project | null;
  authorId: string;
  author?: User;
  visibility: Visibility;
  status: ContentStatus;
  copyCount: number;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tags: { tag: Tag }[];
  liked?: boolean;
  saved?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCodes: number;
  totalPrompts: number;
  totalCategories: number;
  totalLikes: number;
  totalCopies: number;
  pendingReports: number;
}

export interface AdminReport {
  id: string;
  itemType: ItemType;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: User;
  code: Code | null;
  prompt: Prompt | null;
}

export interface AdminLog {
  id: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
  admin: User;
}

export interface ActivityItem {
  id: string;
  type: "code" | "prompt" | "admin_log";
  text: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  updatedAt?: string;
}
