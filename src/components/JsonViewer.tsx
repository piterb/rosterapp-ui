import { useMemo, useState } from "react";

type JsonViewerProps = {
  data: unknown | null;
  title?: string;
};

export function JsonViewer({ data, title }: JsonViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const formatted = useMemo(() => {
    if (!data) {
      return "No data loaded yet.";
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
        <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">{title ?? "Response"}</span>
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-runway-500 hover:text-runway-500"
        >
          {isCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      {!isCollapsed && (
        <pre className="code-block max-h-80 overflow-auto whitespace-pre-wrap text-sm text-slate-200">
          {formatted}
        </pre>
      )}
    </div>
  );
}
