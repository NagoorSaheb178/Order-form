import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { activeOrders, orderEventBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderIdParam = searchParams.get("orderId");
    const tableNoParam = searchParams.get("tableNo");

    const requestedIds = orderIdParam
      ? orderIdParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // Never return historical orders of past diners if customer has no order IDs
    if (requestedIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active orders found for this session", orders: [] },
        { status: 404 }
      );
    }

    const parsedTableNo = tableNoParam ? Number(tableNoParam) : null;
    const ordersMap = new Map<string, any>();

    // 1. Gather matching orders from in-memory cache strictly for requestedIds
    for (const o of activeOrders.values()) {
      const oId = o.orderId || o.orderReference;
      if (requestedIds.includes(oId) || requestedIds.includes(o.orderReference)) {
        ordersMap.set(oId, o);
      }
    }

    // 2. Query MongoDB strictly for requestedIds belonging to this customer
    try {
      await connectToDatabase();

      const dbOrders = await Order.find({
        $or: [
          { orderId: { $in: requestedIds } },
          { orderReference: { $in: requestedIds } },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      for (const dbOrder of dbOrders) {
        const oId = dbOrder.orderId || dbOrder.orderReference;
        ordersMap.set(oId, dbOrder);
        activeOrders.set(oId, dbOrder);
      }
    } catch (dbErr: any) {
      console.warn("MongoDB query skipped/failed:", dbErr?.message || dbErr);
    }

    const allOrdersList = Array.from(ordersMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    if (allOrdersList.length === 0) {
      return NextResponse.json(
        { success: false, message: "No orders found", orders: [] },
        { status: 404 }
      );
    }

    // Determine primary order (first requested ID, or latest order)
    let primary = allOrdersList[0];
    if (requestedIds.length > 0) {
      const match = allOrdersList.find(
        (o) => o.orderId === requestedIds[0] || o.orderReference === requestedIds[0]
      );
      if (match) primary = match;
    }

    const formatOrder = (o: any) => ({
      orderId: o.orderId || o.orderReference,
      restaurantId: o.restaurantId || "REST-001",
      tableNo: Number(o.tableNo || o.tableNumber || parsedTableNo || 1),
      status: o.status || "RECEIVED",
      kitchenAcknowledged: !!(o.kitchenAcknowledged || o.kitchenNotified),
      kitchenNotified: !!(o.kitchenNotified || o.kitchenAcknowledged),
      items: (o.items || []).map((it: any) => ({
        ...it,
        qty: Number(it.qty || it.quantity || 1),
        quantity: Number(it.qty || it.quantity || 1),
      })),
      totalAmount: o.totalAmount || 0,
      orderNote: o.orderNote || "",
      statusHistory: o.statusHistory || [],
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      order: formatOrder(primary),
      orders: allOrdersList.map(formatOrder),
    });
  } catch (err: any) {
    console.error("Order status fetch error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret =
      process.env.CUSTOMER_STATUS_WEBHOOK_SECRET;

    const incomingSecret =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (secret && incomingSecret !== secret) {
      console.warn("[CUSTOMER] Unauthorized status callback attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const extId = (body.externalOrderId || body.orderId || body.orderReference || "").trim();
    const status = (body.status || "").trim();
    const restaurantId = body.restaurantId || "REST-001";
    const updatedAt = body.updatedAt || new Date().toISOString();

    if (!extId || !status) {
      return NextResponse.json(
        { error: "Missing externalOrderId or status" },
        { status: 422 }
      );
    }

    console.log(`[CUSTOMER] Status callback received: ${extId} ${status}`);

    await connectToDatabase();

    const queryConditions: any[] = [
      { orderId: extId },
      { orderReference: extId },
    ];
    if (mongoose.Types.ObjectId.isValid(extId)) {
      queryConditions.push({ _id: new mongoose.Types.ObjectId(extId) });
    }

    const order = await Order.findOne({ $or: queryConditions });

    if (!order) {
      console.warn(`[CUSTOMER] Order not found: ${extId}`);
      return NextResponse.json(
        { error: "Order not found", externalOrderId: extId },
        { status: 404 }
      );
    }

    console.log(`[CUSTOMER] Order found: ${extId}`);

    // Update database directly
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          status: status,
          kitchenAcknowledged: true,
          kitchenNotified: true,
          updatedAt: new Date(updatedAt),
        },
      }
    );

    console.log(`[CUSTOMER] Database updated: ${extId} -> ${status}`);

    // Update memory cache
    const targetRef = order.orderReference || order.orderId || extId;
    const cachedOrder = {
      ...(order.toObject ? order.toObject() : order),
      status,
      kitchenAcknowledged: true,
      kitchenNotified: true,
      updatedAt,
    };
    if (order.orderId) activeOrders.set(order.orderId, cachedOrder);
    if (order.orderReference) activeOrders.set(order.orderReference, cachedOrder);

    // Emit realtime event
    const eventPayload = {
      event: "ORDER_STATUS_UPDATED" as const,
      orderId: targetRef,
      restaurantId,
      status: status,
      kitchenAcknowledged: true,
      updatedAt,
    };

    orderEventBus.emit("order_status", eventPayload);
    if (order.orderId && order.orderId !== targetRef) {
      orderEventBus.emit("order_status", {
        ...eventPayload,
        orderId: order.orderId,
      });
    }

    console.log(`[CUSTOMER] Realtime event emitted: ${extId} -> ${status}`);

    return NextResponse.json({ success: true, orderId: targetRef, status });
  } catch (err: any) {
    console.error("[CUSTOMER] Status callback handler error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
