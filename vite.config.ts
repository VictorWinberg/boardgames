import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

import { patchGameCoverApi } from "./vite-plugin-patch-game-cover";

export default defineConfig(() => ({
  base: process.env.VITE_BASE_URL ?? "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), patchGameCoverApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
