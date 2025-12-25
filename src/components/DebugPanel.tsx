import { useSyncExternalStore } from "react";
import { getDebugState, subscribeDebugState } from "../api/debugStore";

export function DebugPanel() {
  const debugState = useSyncExternalStore(subscribeDebugState, getDebugState, getDebugState);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 text-xs text-slate-200">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">Debug</span>
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Last request</div>
          {debugState.request ? (
            <div className="mt-2 space-y-1">
              <div>URL: {debugState.request.url}</div>
              <div>Method: {debugState.request.method}</div>
              <div>Headers: {JSON.stringify(debugState.request.headers)}</div>
            </div>
          ) : (
            <div className="mt-2 text-slate-500">No request yet.</div>
          )}
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Last response</div>
          {debugState.response ? (
            <div className="mt-2 space-y-1">
              <div>Status: {debugState.response.status}</div>
              <div>Body: {debugState.response.bodySnippet}</div>
            </div>
          ) : (
            <div className="mt-2 text-slate-500">No response yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
