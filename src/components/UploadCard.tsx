import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { createApiClient } from "../api/client";
import type { ApiError } from "../api/types";
import { JsonViewer } from "./JsonViewer";

type OutputFormat = "JSON" | "ICS";

const DEFAULT_MAX_MB = 1;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function getMaxSizeMb() {
  const raw = Number.parseFloat(import.meta.env.VITE_MAX_UPLOAD_MB ?? String(DEFAULT_MAX_MB));
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_MAX_MB;
  }
  return raw;
}

function getFileError(file: File, maxSizeBytes: number) {
  const lowerName = file.name.toLowerCase();
  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "PDF files are not supported. Please upload a JPG or PNG image.";
  }
  const isAllowedType =
    ALLOWED_TYPES.includes(file.type) || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png");
  if (!isAllowedType) {
    return "Only JPG and PNG images are supported.";
  }
  if (file.size > maxSizeBytes) {
    return `File is too large. Maximum size is ${getMaxSizeMb()} MB.`;
  }
  return null;
}

function useSimulatedProgress() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => {
    setProgress(0);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    let current = 0;
    const timer = window.setInterval(() => {
      current += Math.random() * 18 + 8;
      if (current >= 100) {
        current = 100;
        window.clearInterval(timer);
        setIsRunning(false);
      }
      setProgress(current);
    }, 260);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  return { progress, isRunning, start, setProgress, setIsRunning };
}

export function UploadCard() {
  const { getAccessToken, login, isAuthenticated, isLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("JSON");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertData, setConvertData] = useState<unknown | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { progress, isRunning, start, setProgress, setIsRunning } = useSimulatedProgress();

  const maxSizeMb = getMaxSizeMb();
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const apiClient = useMemo(
    () =>
      createApiClient({
        getAccessToken,
        login
      }),
    [getAccessToken, login]
  );

  const handleFile = useCallback(
    (nextFile: File | null) => {
      setMessage(null);
      setApiError(null);
      if (!nextFile) {
        setFile(null);
        setValidationError(null);
        return;
      }
      const validation = getFileError(nextFile, maxSizeBytes);
      if (validation) {
        setFile(null);
        setValidationError(validation);
        return;
      }
      setValidationError(null);
      setFile(nextFile);
    },
    [maxSizeBytes]
  );

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const dropHandlers = useMemo(
    () => ({
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files?.[0];
        handleFile(droppedFile ?? null);
      }
    }),
    [handleFile]
  );

  const onConvert = async () => {
    setMessage(null);
    setValidationError(null);
    setApiError(null);

    if (!file) {
      setValidationError("Select an image before converting.");
      return;
    }
    if (!isAuthenticated || isLoading) {
      setValidationError("Please log in before converting.");
      return;
    }

    setIsConverting(true);
    setConvertData(null);
    start();

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("outputFormat", outputFormat);

      const response = await apiClient.request<unknown>("/api/roster/convert", {
        method: "POST",
        body: formData
      });

      setConvertData(response);
      setMessage("Conversion complete. JSON metadata received.");
    } catch (err) {
      if (err && typeof err === "object" && "status" in err) {
        setApiError(err as ApiError);
      } else {
        setApiError({ status: 0, message: err instanceof Error ? err.message : "Conversion failed." });
      }
    } finally {
      setIsConverting(false);
      setProgress(100);
      setIsRunning(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Roster image convert</h3>
          <p className="text-sm text-slate-300">Upload a roster screenshot for conversion.</p>
        </div>
        <span className="rounded-full border border-runway-500/60 bg-runway-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-runway-500">
          Phase 2
        </span>
      </div>

      <div
        className="rounded-2xl border border-dashed border-slate-600/60 bg-slate-950/60 p-6 text-center transition hover:border-runway-500/80"
        {...dropHandlers}
      >
        <p className="text-sm text-slate-300">Drag & drop your roster image here.</p>
        <p className="mt-1 text-xs text-slate-500">JPG or PNG only · {maxSizeMb} MB max</p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-600/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-runway-500 hover:text-runway-500">
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
          Choose file
        </label>
      </div>

      {validationError && (
        <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{validationError}</div>
      )}
      {apiError && (
        <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          <div className="font-semibold">Error {apiError.status}</div>
          <div>{apiError.message}</div>
          {apiError.details != null && (
            <pre className="code-block mt-2 text-xs text-red-200">{JSON.stringify(apiError.details, null, 2)}</pre>
          )}
        </div>
      )}
      {message && (
        <div className="mt-4 rounded-2xl border border-skyglass-400/40 bg-skyglass-400/10 p-3 text-sm text-skyglass-100">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preview</div>
          {previewUrl ? (
            <img src={previewUrl} alt="Roster preview" className="mt-3 h-48 w-full rounded-xl object-cover" />
          ) : (
            <div className="mt-3 flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-700/60 text-sm text-slate-500">
              No image selected
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Output</div>
          <div className="mt-3 flex gap-2">
            {(["JSON", "ICS"] as OutputFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => setOutputFormat(format)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  outputFormat === format
                    ? "border-runway-500 bg-runway-500/20 text-runway-500"
                    : "border-slate-700/60 text-slate-300 hover:border-runway-500/60"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">Default is JSON. ICS returns a downloadable roster file.</div>

          <button
            type="button"
            onClick={() => void onConvert()}
            disabled={!file || isConverting}
            className="mt-5 w-full rounded-xl bg-runway-500/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-runway-500 disabled:cursor-not-allowed disabled:bg-slate-700/50 disabled:text-slate-400"
          >
            {isConverting ? "Converting..." : "Convert image"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Upload progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-runway-500 transition" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-slate-500">{isRunning ? "Uploading..." : "Ready."}</div>
      </div>

      <div className="mt-6">
        <JsonViewer data={convertData} title="/api/roster/convert response" />
      </div>
    </div>
  );
}
