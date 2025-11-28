import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { appendOrderToSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, items, totalAmount } = body;

    if (!phone || !items || !items.length) {
      return NextResponse.json(
        { message: "Invalid order" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.create({
      phone,
      items,
      totalAmount,
    });

    // 🚀 IMPORTANT: This fixes the WRONG-ORDER problem
    await appendOrderToSheet({
      phone,
      items,
      totalAmount,
    });

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
      { message: "Server error" },
      { status: 500 }
    );
  }
}
