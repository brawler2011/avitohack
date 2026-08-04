/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PROXY_TARGET?: string;
  readonly FRONTEND_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
