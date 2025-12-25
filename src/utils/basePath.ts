export function normalizeBasePath(base?: string) {
  if (!base || base === "/") {
    return "/";
  }
  const withLeading = base.startsWith("/") ? base : `/${base}`;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
}

export function getBasePath() {
  return normalizeBasePath(import.meta.env.VITE_GH_PAGES_BASE);
}

export function withBasePath(path: string) {
  const base = getBasePath();
  if (base === "/") {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
