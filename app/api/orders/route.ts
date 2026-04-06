import { getAllOrders, insertOrder, deleteAllOrders, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await initDb();
  return Response.json(await getAllOrders());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { guest_name, drink_id, drink_name, customizations } = body;

  if (!guest_name?.trim() || !drink_id || !drink_name) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (
    guest_name.trim().length > 50 ||
    drink_id.length > 50 ||
    drink_name.length > 100
  ) {
    return Response.json({ error: "Input too long" }, { status: 400 });
  }

  await initDb();
  const order = await insertOrder(
    guest_name.trim(),
    drink_id,
    drink_name,
    JSON.stringify(customizations ?? {})
  );

  return Response.json(order, { status: 201 });
}

export async function DELETE() {
  await initDb();
  await deleteAllOrders();
  return new Response(null, { status: 204 });
}
