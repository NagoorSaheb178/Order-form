import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

// GET /api/kitchen/orders?restaurantId=REST-001
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId") || "REST-001";

    await connectToDatabase();

    // Fetch orders for this restaurant, sorted newest first
    const orders = await Order.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      restaurantId,
      orders: orders.map((o) => ({
        orderId: o.orderId || o.orderReference,
        restaurantId: o.restaurantId,
        tableNo: o.tableNo || o.tableNumber,
        status: o.status,
        kitchenAcknowledged: !!o.kitchenAcknowledged,
        items: o.items,
        totalAmount: o.totalAmount,
        orderNote: o.orderNote,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error("Kitchen orders fetch error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
