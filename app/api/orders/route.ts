import { getDb, type Order } from "@/lib/db";
import { orderEmitter } from "@/lib/emitter";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];
  return Response.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { guest_name, drink_id, drink_name, customizations } = body;

  if (!guest_name?.trim() || !drink_id || !drink_name) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (guest_name.trim().length > 50 || drink_id.length > 50 || drink_name.length > 100) {
    return Response.json({ error: "Input too long" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO orders (guest_name, drink_id, drink_name, customizations) VALUES (?, ?, ?, ?)"
    )
    .run(
      guest_name.trim(),
      drink_id,
      drink_name,
      JSON.stringify(customizations ?? {})
    );

  const order = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(result.lastInsertRowid) as Order;

  orderEmitter.emit("update", { type: "new_order", order });

  return Response.json(order, { status: 201 });
}

export async function DELETE() {
  const db = getDb();
  db.prepare("DELETE FROM orders").run();
  orderEmitter.emit("update", { type: "reset" });
  return new Response(null, { status: 204 });
}
