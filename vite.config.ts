import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel serves from the root by default. Set VITE_BASE_PATH=/brain-architecture-studio/
// when building for GitHub Pages or another subdirectory deployment.
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base: './', // <--- 关键点：这里补上了逗号
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
