import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Production builds (`vite build`) intentionally ignore any local `.env` files
  // so deployments rely exclusively on environment variables injected by the
  // hosting provider or CI/CD pipeline. Local `vite` dev server still reads an
  // untracked `.env` file if you create one from `.env.example`.
  envDir: command === "build" ? false : process.cwd(),
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://fte002n1.salesmate.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api(\/|$)/, "/"),
      },
    },
  },
}));
