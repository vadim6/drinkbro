import Database from "better-sqlite3";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

export interface Order {
  id: number;
  guest_name: string;
  drink_id: string;
  drink_name: string;
  customizations: string;
  status: "pending" | "done";
  created_at: string;
}

export function getDb(): Database.Database {
  if (globalThis.__db) return globalThis.__db;

  const DB_PATH =
    process.env.DB_PATH ?? path.join(process.cwd(), "orders.db");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      drink_id TEXT NOT NULL,
      drink_name TEXT NOT NULL,
      customizations TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  globalThis.__db = db;
  return db;
}
