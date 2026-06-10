/**
 * API 根路径：
 * - 开发：留空，fetch('/api/...') 由 Vite 代理到 http://localhost:3001
 * - 生产：在 .env 设置 VITE_API_BASE=https://你的后端域名
 */
export function getApiBase(): string {
  const base = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "";
  return base;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalized}`;
}
