import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

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

    await connectToDatabase();
    const order: any = await Order.findOne({
      $or: [{ orderId }, { orderReference: orderId }],
    }).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId || order.orderReference,
        restaurantId: order.restaurantId,
        tableNo: order.tableNo || order.tableNumber,
        status: order.status,
        kitchenAcknowledged: !!order.kitchenAcknowledged,
        items: order.items,
        totalAmount: order.totalAmount,
        orderNote: order.orderNote,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
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
