import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBase(base: string | undefined) {
  if (!base || base === "/") {
    return "/";
  }
  const withLeading = base.startsWith("/") ? base : `/${base}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBase(env.VITE_GH_PAGES_BASE);

  return {
    base,
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: "src/test/setup.ts"
    }
  };
});
