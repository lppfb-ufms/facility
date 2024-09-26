import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        unstable_singleFetch: true,
        unstable_lazyRouteDiscovery: true,
        unstable_optimizeDeps: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "~": "/app",
    },
  },
  optimizeDeps: {
    exclude: ["@node-rs/argon2"],
  },
});
