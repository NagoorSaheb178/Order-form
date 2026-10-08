import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { orderEventBus, activeOrders } from "@/lib/events";

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
    let dbSaved = false;
    let dbErrorMessage = "";
    try {
      await connectToDatabase();
      const order = await Order.create(orderData);
      if (order?._id) {
        savedOrderId = order.orderId || ref;
        dbSaved = true;
        console.log(`✅ Order ${ref} (Table ${tNum}) saved to MongoDB successfully.`);
      }
    } catch (dbErr: any) {
      dbErrorMessage = dbErr?.message || String(dbErr);
      console.error("❌ MongoDB save error:", dbErrorMessage);
    }

    if (!dbSaved) {
      return NextResponse.json(
        {
          success: false,
          message: `Could not save order to database: ${dbErrorMessage}. Please ensure MONGODB_URI is configured in Vercel Environment Variables.`,
        },
        { status: 500 }
      );
    }

    // Store in active in-memory cache for instant status queries
    activeOrders.set(ref, {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Broadcast new order to Kitchen AI in realtime (internal bus)
    orderEventBus.emit("new_order", {
      event: "NEW_ORDER",
      order: orderData,
      restaurantId,
    });

    // Send HTTP Order Webhook to Kitchen AI Backend
    let kitchenNotified = false;
    let kitchenInternalId = "";
    const kitchenWebhookUrl =
      process.env.KITCHEN_ORDER_WEBHOOK_URL ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:3001/api/webhooks/orders" : "");

    if (kitchenWebhookUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const kitchenHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (process.env.KITCHEN_STATUS_WEBHOOK_SECRET) {
          kitchenHeaders["x-webhook-secret"] = process.env.KITCHEN_STATUS_WEBHOOK_SECRET;
        }

        const kitchenRes = await fetch(kitchenWebhookUrl, {
          method: "POST",
          headers: kitchenHeaders,
          body: JSON.stringify({
            restaurantId,
            externalOrderId: ref,
            tableNo: tNum,
            items: items.map((i: any) => ({
              name: i.name,
              quantity: i.quantity || i.qty || 1,
              note: i.note || "",
            })),
            createdAt: new Date().toISOString(),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (kitchenRes.ok) {
          const kData = await kitchenRes.json().catch(() => ({}));
          if (kData.success || kitchenRes.status === 200 || kitchenRes.status === 201) {
            kitchenNotified = true;
            kitchenInternalId = kData.orderId || "";
            console.log(`[CUSTOMER] Kitchen AI acknowledged order ${ref}:`, kData);

            // Update database and cache with acknowledgement
            try {
              await connectToDatabase();
              await Order.updateOne(
                { orderId: ref },
                {
                  $set: {
                    kitchenAcknowledged: true,
                    kitchenNotified: true,
                    kitchenOrderId: kitchenInternalId,
                  },
                }
              );
            } catch (uErr) {
              console.warn("DB update acknowledgement warning:", uErr);
            }

            const inMemory = activeOrders.get(ref);
            if (inMemory) {
              inMemory.kitchenAcknowledged = true;
              inMemory.kitchenNotified = true;
              inMemory.kitchenOrderId = kitchenInternalId;
            }
          }
        } else {
          console.warn(`[CUSTOMER] Kitchen webhook returned HTTP ${kitchenRes.status}`);
        }
      } catch (kErr: any) {
        console.warn(`[CUSTOMER] Kitchen order webhook skipped or unreachable: ${kErr?.message || kErr}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: ref,
        orderReference: ref,
        status: "RECEIVED",
        kitchenAcknowledged: kitchenNotified,
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
