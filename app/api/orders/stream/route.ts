export const runtime = "edge";
export const dynamic = "force-dynamic";

import { getClient } from "@/lib/db";
import type { Order } from "@/lib/db";

async function fetchSnapshot(client: ReturnType<typeof getClient>): Promise<{
  orders: Order[];
  hash: string;
}> {
  const r = await client.execute(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  const orders = r.rows as unknown as Order[];
  const hash = orders.map((o) => `${o.id}:${o.status}`).join(",");
  return { orders, hash };
}

export async function GET() {
  const encoder = new TextEncoder();
  const client = getClient();
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      send({ type: "connected" });

      let { orders, hash: lastHash } = await fetchSnapshot(client);
      send({ type: "snapshot", orders });

      intervalId = setInterval(async () => {
        try {
          const { orders: next, hash } = await fetchSnapshot(client);
          if (hash !== lastHash) {
            lastHash = hash;
            send({ type: "snapshot", orders: next });
          } else {
            send({ type: "ping" });
          }
        } catch {
          clearInterval(intervalId);
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }, 2000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
