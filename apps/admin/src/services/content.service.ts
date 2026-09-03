import type { Code, Prompt } from "@codevault/types";
import { api } from "../lib/api";

export interface CodeInput {
  title: string;
  description: string;
  content: string;
  language: string;
  framework?: string;
  categorySlug?: string;
  tags?: string[];
  visibility?: "PUBLIC" | "PRIVATE";
}

export interface PromptInput {
  title: string;
  description: string;
  content: string;
  categorySlug?: string;
  aiModel?: string;
  tags?: string[];
  variables?: { key: string; label: string; defaultValue?: string }[];
  visibility?: "PUBLIC" | "PRIVATE";
}

export const contentService = {
  createCode: (data: CodeInput) => api.post<Code>("/codes", data),
  createPrompt: (data: PromptInput) => api.post<Prompt>("/prompts", data),
};
