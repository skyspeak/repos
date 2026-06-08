import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): pg.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Add a Postgres URL in your Vercel environment variables (Neon or Vercel Postgres).",
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getPool(), { schema });
    }
    const value = dbInstance[prop as keyof typeof dbInstance];
    return typeof value === "function" ? value.bind(dbInstance) : value;
  },
});

export * from "./schema";
