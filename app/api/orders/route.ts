import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { appendOrderToSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic"; // important for Vercel

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, items, totalAmount } = body;

    if (!phone || !items?.length) {
      return NextResponse.json(
        { success: false, message: "Invalid order" },
        { status: 400 }
      );
    }

    // 1️⃣ MongoDB Cached Connection
    await connectToDatabase();

    // 2️⃣ Save Order in DB (wait)
    const order = await Order.create({ phone, items, totalAmount });

    // 3️⃣ Fire & Forget — FAST
    appendOrderToSheet({ phone, items, totalAmount });

    return NextResponse.json(
      {
        success: true,
        orderId: order._id.toString(),
        message: "Order saved",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
