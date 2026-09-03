import type { SiteSettings } from "@codevault/types";
import { api } from "../lib/api";

export const settingsService = {
  get: () => api.get<SiteSettings>("/settings"),
};
