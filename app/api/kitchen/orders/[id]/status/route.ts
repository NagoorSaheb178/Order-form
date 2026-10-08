import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { orderEventBus } from "@/lib/events";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["SUBMITTED", "RECEIVED", "PREPARING", "READY", "SERVED"];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json();
    const { status, restaurantId = "REST-001" } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify restaurant isolation
    const order = await Order.findOne({
      $or: [{ orderId }, { orderReference: orderId }],
      restaurantId,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found or does not belong to this restaurant.",
        },
        { status: 404 }
      );
    }

    order.status = status;
    // If moving to preparing or beyond, ensure kitchenAcknowledged is true
    if (status === "PREPARING" || status === "READY" || status === "SERVED") {
      order.kitchenAcknowledged = true;
    }

    await order.save();

    const updatedAt = new Date().toISOString();

    // Broadcast status change in realtime to customer app and kitchen displays
    orderEventBus.emit("order_status", {
      event: "ORDER_STATUS_UPDATED",
      orderId: order.orderId || order.orderReference,
      restaurantId: order.restaurantId,
      status: order.status,
      kitchenAcknowledged: order.kitchenAcknowledged,
      updatedAt,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId || order.orderReference,
      status: order.status,
      kitchenAcknowledged: order.kitchenAcknowledged,
      message: `Order status updated to ${status}`,
    });
  } catch (err: any) {
    console.error("Kitchen status update error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
