import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { activeOrders } from "@/lib/events";

export const dynamic = "force-dynamic";

// GET /api/kitchen/orders?restaurantId=REST-001
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId") || "REST-001";

    let ordersList: any[] = [];

    // Try fetching from MongoDB
    try {
      await connectToDatabase();
      const dbOrders = await Order.find({ restaurantId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      if (dbOrders && dbOrders.length > 0) {
        ordersList = dbOrders;
      }
    } catch (dbErr: any) {
      console.warn("MongoDB kitchen query warning:", dbErr?.message || dbErr);
    }

    // Fallback to in-memory orders if DB is empty or unreachable
    if (ordersList.length === 0) {
      ordersList = Array.from(activeOrders.values()).filter(
        (o) => !o.restaurantId || o.restaurantId === restaurantId
      );
    }

    return NextResponse.json({
      success: true,
      restaurantId,
      orders: ordersList.map((o) => ({
        orderId: o.orderId || o.orderReference,
        restaurantId: o.restaurantId || restaurantId,
        tableNo: o.tableNo || o.tableNumber || 1,
        status: o.status || "RECEIVED",
        kitchenAcknowledged: !!o.kitchenAcknowledged,
        items: o.items || [],
        totalAmount: o.totalAmount || 0,
        orderNote: o.orderNote || "",
        createdAt: o.createdAt || new Date().toISOString(),
        updatedAt: o.updatedAt || new Date().toISOString(),
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
