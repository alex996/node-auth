import Database from "better-sqlite3";
import fs from "node:fs";
import { env } from "./config.js";

// FIXME you probably want to use Postgres in prod.
export const db = new Database(env.DB_FILENAME);
db.pragma("journal_mode = WAL");

// You can make this conditional: if (env.MIGRATE) {}
// or move this to scripts/migrate.ts
const migration = fs.readFileSync("schema.sql", "utf8");
db.exec(migration);

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  verified_at: number | null;
}

export function serializeUser(user: User) {
  const { password_hash, ...rest } = user;
  return rest;
}

export interface ResetToken {
  id: number;
  user_id: number;
  body: Buffer;
  expired_at: number;
}

// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
// https://gist.github.com/bonniss/2fb3853640510b697ca38255ec6bd282
