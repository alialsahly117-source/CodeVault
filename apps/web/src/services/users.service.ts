import { api } from "../lib/api";
import type { Code, Prompt } from "@codevault/types";

interface SavedItemRow {
  id: string;
  itemType: "CODE" | "PROMPT";
  code: Code | null;
  prompt: Prompt | null;
  createdAt: string;
}

export const usersService = {
  saved: () => api.get<SavedItemRow[]>("/users/me/saved"),
  liked: () => api.get<SavedItemRow[]>("/users/me/liked"),
  contributions: () => api.get<{ codes: Code[]; prompts: Prompt[] }>("/users/me/contributions"),
};
