import { NextRequest } from "next/server";
import { orderEventBus, OrderStatusEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetOrderId = searchParams.get("orderId");

  if (!targetOrderId) {
    return new Response("Missing orderId parameter", { status: 400 });
  }

  let isClosed = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let statusListener: ((event: OrderStatusEvent) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          cleanup();
        }
      };

      // Send initial connected confirmation
      send({ event: "CONNECTED", orderId: targetOrderId });

      // Listen to status updates
      statusListener = (event: OrderStatusEvent) => {
        if (event.orderId === targetOrderId) {
          send({
            event: "ORDER_STATUS_UPDATED",
            orderId: event.orderId,
            status: event.status,
            kitchenAcknowledged: event.kitchenAcknowledged,
            updatedAt: event.updatedAt,
          });
        }
      };

      orderEventBus.on("order_status", statusListener);

      // Heartbeat every 15 seconds to keep connection alive
      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          cleanup();
        }
      }, 15000);

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (statusListener) orderEventBus.off("order_status", statusListener);
        try {
          controller.close();
        } catch (e) {}
      };

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      isClosed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (statusListener) orderEventBus.off("order_status", statusListener);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
