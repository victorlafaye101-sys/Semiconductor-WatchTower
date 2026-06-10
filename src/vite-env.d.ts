/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 生产环境后端 API 根地址，如 https://your-api.railway.app */
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
