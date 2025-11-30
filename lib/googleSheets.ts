export async function appendOrderToSheet(order: {
  phone: string;
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
}) {
  try {
    const url = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;

    if (!url) {
      console.error("❌ Google Sheets Webhook Missing!");
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify(order),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("📄 Sheets Response:", text);
    return text;
  } catch (err) {
    console.error("🔥 Google Sheets Webhook Error:", err);
  }
}
