import { createClient, type Client } from "@libsql/client/web";

declare global {
  // eslint-disable-next-line no-var
  var __tursoClient: Client | undefined;
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

export function getClient(): Client {
  if (globalThis.__tursoClient) return globalThis.__tursoClient;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  globalThis.__tursoClient = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return globalThis.__tursoClient;
}

export async function initDb(): Promise<void> {
  await getClient().execute(`
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
}

export async function getAllOrders(): Promise<Order[]> {
  const r = await getClient().execute(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  return r.rows as unknown as Order[];
}

export async function insertOrder(
  guest_name: string,
  drink_id: string,
  drink_name: string,
  customizations: string
): Promise<Order> {
  const c = getClient();
  const r = await c.execute({
    sql: "INSERT INTO orders (guest_name, drink_id, drink_name, customizations) VALUES (?, ?, ?, ?)",
    args: [guest_name, drink_id, drink_name, customizations],
  });
  const row = await c.execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [r.lastInsertRowid!],
  });
  return row.rows[0] as unknown as Order;
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<{ changes: number; order: Order | null }> {
  const c = getClient();
  const r = await c.execute({
    sql: "UPDATE orders SET status = ? WHERE id = ?",
    args: [status, id],
  });
  if (r.rowsAffected === 0) return { changes: 0, order: null };
  const row = await c.execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [id],
  });
  return { changes: r.rowsAffected, order: row.rows[0] as unknown as Order };
}

export async function deleteAllOrders(): Promise<void> {
  await getClient().execute("DELETE FROM orders");
}
