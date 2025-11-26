import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { appendOrderToSheet } from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, items, totalAmount } = body || {};

    if (!phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Invalid order data" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.create({
      phone,
      items,
      totalAmount,
    });

    // Save to Google Sheets (non-blocking)
    appendOrderToSheet({
      phone,
      items,
      totalAmount,
    }).catch((err) => console.error("Sheet write error:", err));

    return NextResponse.json(
      { message: "Order created", orderId: order._id },
      { status: 201 }
    );

  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
