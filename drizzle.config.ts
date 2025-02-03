import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/.server/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/facility",
  },
  casing: "snake_case",
});
