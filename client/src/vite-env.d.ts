/// <reference types="vite/client" />

interface ViteTypeOptions {
  readonly VITE_API_URL: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
