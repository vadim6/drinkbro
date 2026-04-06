import { updateOrderStatus, initDb } from "@/lib/db";

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

  await initDb();
  const { changes, order } = await updateOrderStatus(id, status);

  if (changes === 0) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}
