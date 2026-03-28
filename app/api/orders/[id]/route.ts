import { getDb, type Order } from "@/lib/db";
import { orderEmitter } from "@/lib/emitter";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (status !== "pending" && status !== "done") {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare("UPDATE orders SET status = ? WHERE id = ?")
    .run(status, id);

  if (result.changes === 0) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const order = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(id) as Order;

  orderEmitter.emit("update", { type: "order_updated", order });

  return Response.json(order);
}
