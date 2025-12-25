import type { ApiError } from "./types";
import { setDebugState } from "./debugStore";

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
};

type TokenProvider = {
  getAccessToken: () => Promise<string>;
  login: () => Promise<void>;
};

const RETRY_DELAYS_MS = [300, 900, 2700];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackendBaseUrl() {
  const base =
    (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
    "https://rosterapp-481614-service-641848433310.europe-west3.run.app"
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function redactHeaders(headers: Record<string, string>) {
  const redacted = { ...headers };
  if (redacted.Authorization) {
    redacted.Authorization = "Bearer [redacted]";
  }
  return redacted;
}

function normalizeError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    return {
      status,
      message: typeof body.message === "string" ? body.message : "Request failed",
      error: typeof body.error === "string" ? body.error : undefined,
      details: body.details,
      path: typeof body.path === "string" ? body.path : undefined,
      timestamp: typeof body.timestamp === "string" ? body.timestamp : undefined,
      raw: payload
    };
  }
  return {
    status,
    message: typeof payload === "string" ? payload : "Request failed",
    raw: payload
  };
}

export function createApiClient(tokenProvider: TokenProvider) {
  async function request<T>(path: string, options: RequestOptions = {}) {
    const url = `${getBackendBaseUrl()}${path}`;
    const method = options.method ?? "GET";
    const headers: Record<string, string> = {
      ...(options.headers ?? {})
    };

    let attempt = 0;

    while (true) {
      try {
        const token = await tokenProvider.getAccessToken();
        headers.Authorization = `Bearer ${token}`;
        setDebugState({
          request: {
            url,
            method,
            headers: redactHeaders(headers)
          }
        });

        const response = await fetch(url, {
          method,
          headers,
          body: options.body ?? null
        });

        const contentType = response.headers.get("content-type") ?? "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await response.json() : await response.text();

        setDebugState({
          request: {
            url,
            method,
            headers: redactHeaders(headers)
          },
          response: {
            status: response.status,
            bodySnippet: typeof data === "string" ? data.slice(0, 500) : JSON.stringify(data).slice(0, 500)
          }
        });

        if (!response.ok) {
          throw normalizeError(response.status, data);
        }

        return data as T;
      } catch (error) {
        const isNetworkError = error instanceof TypeError;
        const authError = error && typeof error === "object" && "error" in error ? (error as { error?: string }).error : undefined;
        const status = error && typeof error === "object" && "status" in error ? (error as { status?: number }).status : undefined;
        const isAuthError = authError === "login_required" || authError === "consent_required" || authError === "interaction_required";

        if (isAuthError || status === 401 || status === 403) {
          await tokenProvider.login();
          throw error;
        }

        if (isNetworkError && attempt < RETRY_DELAYS_MS.length) {
          await sleep(RETRY_DELAYS_MS[attempt]);
          attempt += 1;
          continue;
        }

        throw error;
      }
    }
  }

  return {
    request
  };
}
