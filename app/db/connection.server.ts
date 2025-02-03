import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const db = drizzle({
  connection: { url: process.env.DATABASE_URL, prepare: false },
  casing: "snake_case",
  schema,
});

// use drizzle-kit push during development
if (process.env.NODE_ENV === "production") {
  Promise.all([
    migrate(db, { migrationsFolder: "./migrations" }),
    db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent;`),
  ]).then(() => {
    console.log("db ready");
  });
}

export { db };
