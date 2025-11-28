import { google } from "googleapis";

interface OrderForSheet {
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
}

export async function appendOrderToSheet(order: OrderForSheet) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email || !key || !spreadsheetId) {
    console.warn("Google Sheets not configured.");
    return;
  }

  const auth = new google.auth.JWT(
    email,
    undefined,
    key.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  const sheets = google.sheets({ version: "v4", auth });

  const itemsText = order.items
    .map((i) => `${i.name} x${i.quantity} (₹${i.price})`)
    .join("; ");

  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:D",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[now, order.phone, itemsText, order.totalAmount]],
    },
  });
}
