import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { orderEventBus, activeOrders } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the Kitchen request
    const secret =
      process.env.CUSTOMER_STATUS_WEBHOOK_SECRET || "customer-secret-key-change-in-production";

    const incomingSecret =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (incomingSecret !== secret && process.env.NODE_ENV === "production") {
      console.warn("[CUSTOMER] Unauthorized status callback attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    let body: {
      restaurantId?: string;
      externalOrderId?: string;
      status?: string;
      updatedAt?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { restaurantId = "REST-001", externalOrderId, status, updatedAt } = body;

    if (!externalOrderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: externalOrderId and status" },
        { status: 422 }
      );
    }

    console.log(`[CUSTOMER] Status callback received: ${externalOrderId} ${status}`);

    // 3. Connect to database
    await connectToDatabase();

    // 4. Find customer order
    const queryConditions: any[] = [
      { orderId: externalOrderId },
      { orderReference: externalOrderId },
    ];

    if (mongoose.Types.ObjectId.isValid(externalOrderId)) {
      queryConditions.push({ _id: new mongoose.Types.ObjectId(externalOrderId) });
    }

    const order = await Order.findOne({ $or: queryConditions });

    if (!order) {
      console.warn(`[CUSTOMER] Order not found for callback: ${externalOrderId}`);
      return NextResponse.json(
        { error: "Order not found", externalOrderId },
        { status: 404 }
      );
    }

    // 5. Verify restaurantId
    if (order.restaurantId && restaurantId && order.restaurantId !== restaurantId) {
      console.warn(`[CUSTOMER] Restaurant mismatch: expected ${order.restaurantId}, got ${restaurantId}`);
      return NextResponse.json({ error: "Restaurant mismatch" }, { status: 403 });
    }

    console.log(`[CUSTOMER] Order found: ${externalOrderId}`);

    // 6. Update customer order status in DB
    order.status = status;
    order.kitchenAcknowledged = true;
    if (updatedAt) {
      order.updatedAt = new Date(updatedAt);
    }
    await order.save();

    // Update in-memory activeOrders cache
    const orderData = order.toObject ? order.toObject() : order;
    if (order.orderId) activeOrders.set(order.orderId, orderData);
    if (order.orderReference) activeOrders.set(order.orderReference, orderData);

    console.log(`[CUSTOMER] Database updated: ${externalOrderId} -> ${status}`);

    // 7. Publish realtime event for customer UI (SSE)
    const eventTimestamp = updatedAt || new Date().toISOString();
    const eventPayload = {
      event: "ORDER_STATUS_UPDATED" as const,
      orderId: order.orderReference || order.orderId || externalOrderId,
      restaurantId,
      status: status as any,
      kitchenAcknowledged: true,
      updatedAt: eventTimestamp,
    };

    orderEventBus.emit("order_status", eventPayload);

    // Also emit using orderId if different from orderReference
    if (order.orderId && order.orderId !== order.orderReference) {
      orderEventBus.emit("order_status", {
        ...eventPayload,
        orderId: order.orderId,
      });
    }

    console.log(`[CUSTOMER] Realtime event emitted: ${externalOrderId} -> ${status}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[CUSTOMER] Error handling status callback:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
