import { NextRequest } from "next/server";
import { orderEventBus, OrderStatusEvent } from "@/lib/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetOrderId = searchParams.get("orderId");
  const tableNo = searchParams.get("tableNo");

  const targetIds = targetOrderId
    ? targetOrderId.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (targetIds.length === 0 && !tableNo) {
    return new Response("Missing orderId or tableNo parameter", { status: 400 });
  }

  let isClosed = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let autoCloseTimer: NodeJS.Timeout | null = null;
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
      send({ event: "CONNECTED", orderIds: targetIds, tableNo });

      // Listen to status updates
      statusListener = (event: OrderStatusEvent) => {
        const matchesId = targetIds.length > 0 && targetIds.includes(event.orderId);

        if (matchesId) {
          send({
            event: "order.status_changed",
            orderId: event.orderId,
            restaurantId: event.restaurantId,
            status: event.status,
            kitchenAcknowledged: !!event.kitchenAcknowledged,
            updatedAt: event.updatedAt,
          });
          send({
            event: "ORDER_STATUS_UPDATED",
            orderId: event.orderId,
            status: event.status,
            kitchenAcknowledged: !!event.kitchenAcknowledged,
            updatedAt: event.updatedAt,
          });
        }
      };

      orderEventBus.on("order.status_changed", statusListener);
      orderEventBus.on("order_status", statusListener);
      orderEventBus.on("status_updated", statusListener);

      // Heartbeat every 4 seconds to prevent Vercel idle proxy drops
      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          cleanup();
        }
      }, 4000);

      // Cleanly end the stream after 25s before Vercel cuts the lambda with ECONNRESET
      autoCloseTimer = setTimeout(() => {
        cleanup();
      }, 25000);

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        if (statusListener) {
          orderEventBus.off("order.status_changed", statusListener);
          orderEventBus.off("order_status", statusListener);
          orderEventBus.off("status_updated", statusListener);
        }
        try {
          controller.close();
        } catch (e) {}
      };

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      isClosed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
      if (statusListener) {
        orderEventBus.off("order.status_changed", statusListener);
        orderEventBus.off("order_status", statusListener);
        orderEventBus.off("status_updated", statusListener);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
