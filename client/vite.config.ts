import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * 在仓库根目录执行 npm run dev（cwd = 项目根）
 * 开发：/api → http://localhost:3001（仅 dev server 生效）
 * 生产：见 .env.example 中的 VITE_API_BASE，请求使用 src/api/apiUrl()
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
