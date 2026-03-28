import { orderEmitter } from "@/lib/emitter";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      send({ type: "connected" });

      const handler = (payload: unknown) => {
        try {
          send(payload);
        } catch {
          orderEmitter.off("update", handler);
        }
      };

      orderEmitter.on("update", handler);

      const interval = setInterval(() => {
        try {
          send({ type: "ping" });
        } catch {
          clearInterval(interval);
          orderEmitter.off("update", handler);
        }
      }, 25000);

      cleanup = () => {
        clearInterval(interval);
        orderEmitter.off("update", handler);
      };
    },
    cancel() {
      cleanup?.();
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
