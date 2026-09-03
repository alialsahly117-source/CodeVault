export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function createApiClient(baseUrl: string) {
  // The access token cookie is short-lived (15m); the refresh token (30d) is
  // what actually keeps a visitor signed in. A bare 401 used to be treated as
  // "logged out", forcing a fresh login every 15 minutes. This shares one
  // in-flight refresh across concurrent requests so a burst of 401s doesn't
  // fire the refresh endpoint more than once.
  let refreshPromise: Promise<boolean> | null = null;

  async function tryRefresh(): Promise<boolean> {
    if (!refreshPromise) {
      refreshPromise = fetch(`${baseUrl}/auth/refresh`, { method: "POST", credentials: "include" })
        .then((r) => r.ok)
        .catch(() => false)
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  }

  async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      ...options,
    });

    if (res.status === 204) return undefined as T;

    if (res.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
      const refreshed = await tryRefresh();
      if (refreshed) return request<T>(path, options, true);
    }

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : undefined;

    if (!res.ok) {
      throw new ApiError(data?.error || "حدث خطأ غير متوقع.", res.status, data?.details);
    }

    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
