import { NextRequest } from "next/server";
import { orderEventBus, NewOrderEvent, OrderStatusEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetRestaurantId = searchParams.get("restaurantId") || "REST-001";

  let isClosed = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let newOrderListener: ((event: NewOrderEvent) => void) | null = null;
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

      // Initial connection ping
      send({ event: "CONNECTED", restaurantId: targetRestaurantId });

      // Listen for new orders matching this restaurantId
      newOrderListener = (event: NewOrderEvent) => {
        if (event.restaurantId === targetRestaurantId) {
          send({
            event: "NEW_ORDER",
            order: event.order,
            restaurantId: event.restaurantId,
          });
        }
      };

      // Listen for status changes
      statusListener = (event: OrderStatusEvent) => {
        if (event.restaurantId === targetRestaurantId) {
          send({
            event: "ORDER_STATUS_UPDATED",
            orderId: event.orderId,
            status: event.status,
            kitchenAcknowledged: event.kitchenAcknowledged,
            updatedAt: event.updatedAt,
          });
        }
      };

      orderEventBus.on("new_order", newOrderListener);
      orderEventBus.on("order_status", statusListener);

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
        if (newOrderListener) orderEventBus.off("new_order", newOrderListener);
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
      if (newOrderListener) orderEventBus.off("new_order", newOrderListener);
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
