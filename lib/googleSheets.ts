import { google } from "googleapis";

interface OrderForSheet {
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
}

interface QueueItem {
  order: OrderForSheet;
  retries: number;
}

const queue: QueueItem[] = [];
let isProcessing = false;

export function enqueueOrderForSheet(order: OrderForSheet) {
  queue.push({ order, retries: 0 });
  console.log("📥 Added to queue. Current queue:", queue.length);

  processQueue();
}

async function processQueue() {
  if (isProcessing) return;
  if (queue.length === 0) return;

  isProcessing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) break;

    try {
      await writeToSheet(job.order);
      console.log("✅ Google Sheet updated successfully");
    } catch (err) {
      job.retries++;

      console.error(
        `❌ Google Sheet write failed (attempt ${job.retries}):`, err
      );

      if (job.retries < 5) {
        console.log("⏳ Retrying job…");
        queue.push(job); // retry
      } else {
        console.error("🚨 Dropping job after 5 failures");
      }
    }

    await new Promise((res) => setTimeout(res, 500)); // small delay
  }

  isProcessing = false;
}

async function writeToSheet(order: OrderForSheet) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email || !key || !spreadsheetId) {
    throw new Error("Google Sheet env missing");
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
