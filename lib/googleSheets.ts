import { google } from "googleapis";

interface OrderForSheet {
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
}

export async function appendOrderToSheet(order: OrderForSheet) {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!email || !key || !spreadsheetId) {
      console.warn("Google Sheets not configured. Skipping write.");
      return;
    }

    // Fix key newlines
    key = key.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT(email, undefined, key, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);

    const sheets = google.sheets({ version: "v4", auth });

    // Prepare row text (CSV line)
    const itemsText = order.items
      .map((i) => `${i.name} x${i.quantity} (₹${i.price})`)
      .join("; ");

    const now = new Date().toISOString();

    const row = `${now},${order.phone},"${itemsText}",${order.totalAmount}`;

    // 🚀 SUPER FAST write using pasteData (no append scan)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:A",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[now, order.phone, itemsText, order.totalAmount]],
      },
    });

  } catch (err) {
    console.error("Google Sheet write error:", err);
  }
}
