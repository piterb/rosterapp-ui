import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { createApiClient } from "../api/client";
import type { ApiError } from "../api/types";
import { JsonViewer } from "../components/JsonViewer";
import { UploadCard } from "../components/UploadCard";
import { Header } from "../components/Header";
import { DebugPanel } from "../components/DebugPanel";
import { getBasePath } from "../utils/basePath";

export function Home() {
  const { getAccessToken, login, isAuthenticated, isLoading } = useAuth();
  const [meData, setMeData] = useState<unknown | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const apiClient = useMemo(
    () =>
      createApiClient({
        getAccessToken,
        login
      }),
    [getAccessToken, login]
  );

  const authConfigured = Boolean(import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (!redirectPath) {
      return;
    }
    const base = getBasePath();
    const normalized = base !== "/" && redirectPath.startsWith(base) ? redirectPath.slice(base.length) : redirectPath;
    navigate(normalized || "/", { replace: true });
  }, [location.search, navigate]);

  const loadMe = async () => {
    setError(null);
    setIsFetching(true);
    try {
      const response = await apiClient.request<unknown>("/api/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      setMeData(response);
    } catch (err) {
      setMeData(null);
      if (err && typeof err === "object" && "status" in err) {
        setError(err as ApiError);
      } else {
        setError({ status: 0, message: err instanceof Error ? err.message : "Request failed" });
      }
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <Header />

        {!authConfigured && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
            Auth0 is not configured. Set `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` in your `.env` file.
          </div>
        )}

        <section className="glass-panel rounded-3xl p-6 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Who am I?</h2>
              <p className="text-sm text-slate-300">Fetch your profile from `GET /api/me`.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadMe()}
              disabled={isFetching || !isAuthenticated || isLoading}
              className="rounded-full bg-skyglass-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-skyglass-400 disabled:cursor-not-allowed disabled:bg-slate-700/50 disabled:text-slate-400"
            >
              {isFetching ? "Loading..." : "Load /api/me"}
            </button>
          </div>

          {!isAuthenticated && !isLoading && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4 text-sm text-slate-400">
              Please log in to fetch your profile.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
              <div className="font-semibold">Error {error.status}</div>
              <div>{error.message}</div>
              {error.details != null && (
                <pre className="code-block mt-2 text-xs text-red-200">{JSON.stringify(error.details, null, 2)}</pre>
              )}
            </div>
          )}

          <div className="mt-4">
            <JsonViewer data={meData} title="/api/me response" />
          </div>
        </section>

        <section>
          <UploadCard />
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-800/80 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>Build: {import.meta.env.VITE_APP_BUILD ?? "local"}</div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/<github-username>/<repo-name>"
              className="text-slate-400 transition hover:text-runway-500"
            >
              Repo
            </a>
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => setShowDebug((prev) => !prev)}
                className="rounded-full border border-slate-700/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-runway-500 hover:text-runway-500"
              >
                {showDebug ? "Hide debug" : "Show debug"}
              </button>
            )}
          </div>
        </footer>

        {showDebug && <DebugPanel />}
      </div>
    </div>
  );
}
