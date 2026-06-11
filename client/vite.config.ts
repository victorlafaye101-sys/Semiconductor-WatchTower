import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * 在仓库根目录执行 npm run dev（cwd = 项目根）
 * 开发：/api → VITE_API_PROXY_TARGET（默认 localhost:3001，仅 dev server 生效）
 * 生产：构建时注入 VITE_API_BASE，请求走 src/api/apiUrl()，不经过本 proxy
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_API_PROXY_TARGET?.replace(/\/$/, "") ||
    "http://localhost:3001";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
