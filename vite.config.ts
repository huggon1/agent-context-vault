import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const apiTarget = process.env.VITE_API_BASE || "http://localhost:5179";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
