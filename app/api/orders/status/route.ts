import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { activeOrders } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Missing orderId query parameter" },
        { status: 400 }
      );
    }

    let order: any = activeOrders.get(orderId);

    // Also look up in-memory by alternative field
    if (!order) {
      for (const o of activeOrders.values()) {
        if (o.orderId === orderId || o.orderReference === orderId) {
          order = o;
          break;
        }
      }
    }

    // Attempt to query latest order state from MongoDB if available
    try {
      await connectToDatabase();
      const dbOrder: any = await Order.findOne({
        $or: [{ orderId }, { orderReference: orderId }],
      }).lean();

      if (dbOrder) {
        order = dbOrder;
        activeOrders.set(orderId, dbOrder);
      }
    } catch (dbErr: any) {
      // Non-fatal warning: database might be connecting, starting up, or using memory cache
      console.warn("MongoDB query skipped/failed:", dbErr?.message || dbErr);
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId || order.orderReference || orderId,
        restaurantId: order.restaurantId || "REST-001",
        tableNo: order.tableNo || order.tableNumber || 1,
        status: order.status || "RECEIVED",
        kitchenAcknowledged: !!(order.kitchenAcknowledged || order.kitchenNotified),
        kitchenNotified: !!(order.kitchenNotified || order.kitchenAcknowledged),
        items: order.items || [],
        totalAmount: order.totalAmount || 0,
        orderNote: order.orderNote || "",
        statusHistory: order.statusHistory || [],
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Order status fetch error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
