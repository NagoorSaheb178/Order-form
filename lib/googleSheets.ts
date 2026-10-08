<<<<<<< HEAD
// Google Sheets integration has been removed.
export {};
=======
export async function appendOrderToSheet(order: any) {
  try {
    const url = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;

    if (!url) {
      console.error("Google Sheets Webhook Missing!");
      return;
    }

    // Convert to URL encoded
    const qs = new URLSearchParams({ data: JSON.stringify(order) });

    const res = await fetch(`${url}?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    console.log("Sheets Response:", await res.text());
  } catch (err) {
    console.error("🔥 Google Sheets Webhook Error:", err);
  }
}
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
