import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    target: "es2022",
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    reactRouterHonoServer({
      runtime: "bun",
      serverEntryPoint: "app/.server/index.ts",
    }),
  ],
});
