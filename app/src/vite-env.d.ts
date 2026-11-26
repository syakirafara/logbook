/// <reference types="vite/client" />

// The environment variables this app reads (see .env.example).
interface ImportMetaEnv {
  readonly VITE_PROGRAM_ID?: string;
  readonly VITE_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
