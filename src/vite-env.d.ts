/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  readonly VITE_AUTH0_AUDIENCE?: string;
  readonly VITE_BACKEND_BASE_URL?: string;
  readonly VITE_GH_PAGES_BASE?: string;
  readonly VITE_APP_BUILD?: string;
  readonly VITE_ENABLE_CONVERT?: string;
  readonly VITE_MAX_UPLOAD_MB?: string;
  readonly VITE_UI_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
