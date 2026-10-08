import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { orderEventBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const { restaurantId = "REST-001" } = body;

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

    order.kitchenAcknowledged = true;
    await order.save();

    const updatedAt = new Date().toISOString();

    // Broadcast to customer and kitchen
    orderEventBus.emit("order_status", {
      event: "ORDER_STATUS_UPDATED",
      orderId: order.orderId || order.orderReference,
      restaurantId: order.restaurantId,
      status: order.status,
      kitchenAcknowledged: true,
      updatedAt,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId || order.orderReference,
      status: order.status,
      kitchenAcknowledged: true,
      message: "Order acknowledged by kitchen",
    });
  } catch (err: any) {
    console.error("Kitchen acknowledge error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
