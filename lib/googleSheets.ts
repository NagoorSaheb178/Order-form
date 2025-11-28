export async function appendOrderToSheet(order: {
  phone: string;
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
}) {
  try {
    if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
      console.error("Google Sheets Webhook Missing!");
      return;
    }

    await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      cache: "no-store",
    });
  } catch (err) {
    console.error("🔥 Google Sheets Webhook Error:", err);
  }
}
