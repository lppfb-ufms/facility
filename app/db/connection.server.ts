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

migrate(db, { migrationsFolder: "./migrations" });

await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent;`);

export { db };
