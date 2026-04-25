import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.BOT_SQLITE_PATH ?? "./data/bot.sqlite";

type GlobalWithDb = typeof globalThis & { __botDb?: Database.Database };
const g = globalThis as GlobalWithDb;

function initDatabase(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function getBotDb() {
  if (!g.__botDb) {
    g.__botDb = initDatabase();
  }
  return g.__botDb;
}

export function closeBotDb() {
  if (g.__botDb) {
    try {
      g.__botDb.close();
    } catch {
      // ignore
    }
    g.__botDb = undefined;
  }
}
