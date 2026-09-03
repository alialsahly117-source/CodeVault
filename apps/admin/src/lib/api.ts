import { createApiClient } from "@codevault/api-client";

export const api = createApiClient(import.meta.env.VITE_API_URL || "/api");
export { ApiError } from "@codevault/api-client";
