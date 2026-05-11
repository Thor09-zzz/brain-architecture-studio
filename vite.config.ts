import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves at /brain-architecture-studio/ subdirectory in prod.
// Dev server keeps base="/" so local URLs stay clean.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/brain-architecture-studio/" : "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
}));
