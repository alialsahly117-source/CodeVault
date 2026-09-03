import { api } from "../lib/api";
import type { Category } from "@codevault/types";

export const categoriesService = {
  list: () => api.get<Category[]>("/categories"),
};
