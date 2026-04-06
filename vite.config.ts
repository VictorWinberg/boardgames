import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

import { patchGameCoverApi } from "./vite-plugin-patch-game-cover";

export default defineConfig(() => {
  const base = process.env.VITE_BASE_URL ?? "/";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      patchGameCoverApi(),
      {
        name: "favicon-base-url",
        transformIndexHtml(html) {
          return html
            .replace("__FAVICON_HREF__", `${baseWithSlash}favicon.svg`)
            .replace("__FAVICON_PNG_HREF__", `${baseWithSlash}favicon-32x32.png`)
            .replace(
              "__APPLE_TOUCH_ICON_HREF__",
              `${baseWithSlash}apple-touch-icon.png`,
            );
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
