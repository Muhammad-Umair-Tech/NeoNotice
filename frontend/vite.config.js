import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    outDir: "../neo_notice/static/neo_notice/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "./src/main.jsx",
    },
  },
});
