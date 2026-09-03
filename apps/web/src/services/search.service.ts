import { api } from "../lib/api";

export interface SearchSuggestions {
  codes: { id: string; title: string; language: string }[];
  prompts: { id: string; title: string; aiModel?: string | null }[];
  tags: { id: string; name: string; slug: string }[];
}

export const searchService = {
  suggest: (q: string) => api.get<SearchSuggestions>(`/search/suggest?q=${encodeURIComponent(q)}`),
};
