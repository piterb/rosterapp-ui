import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getBasePath } from "../utils/basePath";

export function Callback() {
  const navigate = useNavigate();
  const { handleRedirectCallback, isLoading, hasClient } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!hasClient) {
      setError("Auth0 is not configured.");
      return;
    }
    const run = async () => {
      try {
        const result = await handleRedirectCallback();
        const base = getBasePath();
        const fallback = base === "/" ? "/" : `${base}/`;
        const rawReturnTo = (result.appState?.returnTo as string | undefined) ?? fallback;
        const normalized = base !== "/" && rawReturnTo.startsWith(base) ? rawReturnTo.slice(base.length) : rawReturnTo;
        navigate(normalized || "/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      }
    };

    void run();
  }, [handleRedirectCallback, hasClient, isLoading, navigate]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 text-slate-100">
      <div className="glass-panel max-w-lg rounded-3xl p-8 text-center shadow-panel">
        <h2 className="text-xl font-semibold">Signing you in...</h2>
        <p className="mt-2 text-sm text-slate-300">Completing Auth0 redirect.</p>
        {error && <p className="mt-4 text-sm text-red-200">{error}</p>}
      </div>
    </div>
  );
}
