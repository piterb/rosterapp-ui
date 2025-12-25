import { useAuth } from "../auth/AuthProvider";

export function Header() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const email =
    user && typeof user === "object" && "email" in user && typeof user.email === "string" ? user.email : undefined;
  const authConfigured = Boolean(import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID);

  const statusLabel = isLoading ? "Checking session" : isAuthenticated ? "Authenticated" : "Signed out";

  return (
    <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-runway-500/20 text-xl font-bold text-runway-500">
            RA
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">RosterApp UI</h1>
            <p className="text-sm text-slate-400">Aviation-ready roster intelligence · Phase 1</p>
          </div>
        </div>
        {email && <p className="mt-2 text-xs text-slate-400">Signed in as {email}</p>}
      </div>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          {statusLabel}
        </span>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full border border-runway-500/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-runway-500 transition hover:bg-runway-500/10"
          >
            Logout
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void login()}
            disabled={!authConfigured}
            className="rounded-full bg-runway-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-runway-600 disabled:cursor-not-allowed disabled:bg-slate-700/60 disabled:text-slate-400"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
