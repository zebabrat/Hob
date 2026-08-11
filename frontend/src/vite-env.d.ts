/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin for cross-origin deployments; unset means same-origin. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
