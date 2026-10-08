import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
<<<<<<< HEAD
import { orderEventBus } from "@/lib/events";

export const dynamic = "force-dynamic";
=======
import { appendOrderToSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic"; // important for Vercel
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
<<<<<<< HEAD
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
=======
    const { phone, items, totalAmount } = body;

    if (!phone || !items?.length) {
      return NextResponse.json(
        { success: false, message: "Invalid order" },
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
        { status: 400 }
      );
    }

<<<<<<< HEAD
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
=======
    // 1️⃣ MongoDB Cached Connection
    await connectToDatabase();

    // 2️⃣ Save Order in DB (wait)
    const order = await Order.create({ phone, items, totalAmount });

    // 3️⃣ Fire & Forget — FAST
    appendOrderToSheet({ phone, items, totalAmount });
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5

    return NextResponse.json(
      {
        success: true,
<<<<<<< HEAD
        orderId: ref,
        orderReference: ref,
        status: "RECEIVED",
        kitchenAcknowledged: false,
        message: "Order placed successfully",
=======
        orderId: order._id.toString(),
        message: "Order saved",
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json(
<<<<<<< HEAD
      { success: false, message: "Server error occurred while submitting order" },
=======
      { success: false, message: "Server error" },
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
      { status: 500 }
    );
  }
}
