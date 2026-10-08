import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { orderEventBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableNumber,
      tableNo,
      phone,
      items,
      totalAmount,
      orderNote,
      orderReference,
      restaurantId = "REST-001",
    } = body;

    const tNum = Number(tableNumber || tableNo);

    if (!items?.length || (!tNum && !phone)) {
      return NextResponse.json(
        { success: false, message: "Please provide a table number and at least one item." },
        { status: 400 }
      );
    }

    const ref = orderReference || `AO-${Date.now().toString().slice(-6)}`;
    let savedOrderId = ref;

    const orderData = {
      orderId: ref,
      orderReference: ref,
      restaurantId,
      tableNo: tNum,
      tableNumber: tNum,
      phone: phone || `Table ${tNum}`,
      orderNote: orderNote || "",
      items,
      totalAmount,
      status: "RECEIVED",
      kitchenAcknowledged: false,
    };

    // Save directly to MongoDB
    try {
      await connectToDatabase();
      const order = await Order.create(orderData);
      if (order?._id) {
        savedOrderId = order.orderId || ref;
        console.log(`✅ Order ${ref} (Table ${tNum}) saved to MongoDB successfully.`);
      }
    } catch (dbErr: any) {
      console.warn("MongoDB save warning:", dbErr?.message || dbErr);
    }

    // Broadcast new order to Kitchen AI in realtime
    orderEventBus.emit("new_order", {
      event: "NEW_ORDER",
      order: orderData,
      restaurantId,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: ref,
        orderReference: ref,
        status: "RECEIVED",
        kitchenAcknowledged: false,
        message: "Order placed successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json(
      { success: false, message: "Server error occurred while submitting order" },
      { status: 500 }
    );
  }
}
