# 🍽️ Aster & Olive — Customer Dine-In Ordering System

A Next.js 14 web application designed for restaurant table-side ordering. Diners can scan a table QR code, browse the seasonal menu, customize items with notes, place orders directly to the kitchen, and track preparation status in real time.

Built to synchronize bi-directionally with **Kitchen AI** for automated order reception, cooking timeline updates, and voice announcements.

---

## ✨ Features

- **📱 QR & Table-Driven Dine-In Experience**:
  - Scan QR code or select Table Number (Presets 1–12 or manual input up to 99).
  - Instant URL synchronization (`?tableNo=X`) for seamless session restoration and table switching.
- **📖 Seasonal Menu & Customization**:
  - Categorized browsing: *Popular, Starters, Mains, Desserts, Beverages*.
  - Real-time search by dish name or description.
  - Item detail sheet with quantity counter and special preparation notes.
- **🛒 Cart & Review**:
  - Slide-out order tray with instant price computation.
  - Table-wide instructions / notes for the kitchen.
- **🔄 Multi-Round Table Ordering**:
  - Diners can tap **"+ Order more dishes"** at any time during their meal.
  - Displays all rounds placed for the table with round badges (`Round 1`, `Round 2`), individual status, and a consolidated table bill.
- **⚡ Real-Time Status Tracking**:
  - Visual status timeline: `RECEIVED` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`.
  - Server-Sent Events (SSE) via `/api/orders/events` with frequent heartbeats and graceful fallback to polling.
- **🔒 Customer Session Isolation**:
  - Prevents previous diners' historical orders from appearing to new guests at the same table.
  - "Finish & New Diner" session reset button.
- **🤖 Kitchen AI Synchronization**:
  - Dispatches order webhooks to the Kitchen AI backend upon placement.
  - Receives status callback webhooks from the Kitchen AI backend to update customer screens live.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Serverless Functions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Real-Time Communication**: Server-Sent Events (SSE) + EventBus + HTTP Status Webhooks
- **Styling**: Vanilla CSS design tokens + Tailwind CSS utilities
- **Typography**: Editorial typography (*Fraunces* serif & *DM Sans*)

---

## 📁 Project Structure

```
Order-form/
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   ├── route.ts            # POST /api/orders (Order creation & Kitchen dispatch)
│   │   │   ├── status/route.ts     # GET & POST /api/orders/status (Query status & webhook receiver)
│   │   │   └── events/route.ts     # GET /api/orders/events (SSE stream for live status updates)
│   │   ├── integrations/
│   │   │   └── order-status/route.ts # POST webhook endpoint for Kitchen AI callbacks
│   │   └── kitchen/                # Kitchen-facing endpoints (orders, events)
│   ├── globals.css                 # Global styling & layout primitives
│   ├── layout.tsx                  # Root layout with Google Fonts
│   └── page.tsx                    # Main Customer Application (Welcome, Menu, Cart, Status)
├── lib/
│   ├── mongodb.ts                  # Resilient MongoDB connection manager (cloud/local safe)
│   ├── events.ts                   # In-memory EventEmitter & order cache
│   ├── menu.ts                     # Menu item catalog & pricing
│   └── categories.ts               # Menu category definitions
├── models/
│   └── Order.ts                    # Mongoose Order Schema & Model
├── public/                         # Static assets & menu imagery
├── .env.example                    # Environment variable template
└── package.json                    # Project dependencies & scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.17+ or v20+
- A [MongoDB Atlas](https://cloud.mongodb.com/) cluster (or local MongoDB)

### 2. Installation
```bash
git clone https://github.com/NagoorSaheb178/Order-form.git
cd Order-form/Order-form
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the project root:

```env
# ============================
# 🍃 MONGODB CONNECTION
# ============================
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/restaurant_orders?retryWrites=true&w=majority

# ============================
# 🍳 KITCHEN AI INTEGRATION
# ============================
KITCHEN_ORDER_WEBHOOK_URL=http://localhost:3001/api/webhooks/orders
KITCHEN_STATUS_WEBHOOK_SECRET=your-shared-secret-key
CUSTOMER_STATUS_WEBHOOK_SECRET=your-shared-secret-key
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To simulate visiting a specific table:
```
http://localhost:3000/?tableNo=4
```

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/).
3. Set **Root Directory** to `Order-form` (if nested in a subfolder).
4. Configure **Environment Variables** in Vercel (*Settings* ➔ *Environment Variables*):
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `KITCHEN_ORDER_WEBHOOK_URL`: (Optional) Production URL of your Kitchen AI webhook.
   - `CUSTOMER_STATUS_WEBHOOK_SECRET`: (Optional) Shared secret for status callback verification.
5. Deploy!

> **⚠️ Important MongoDB Atlas Network Access Rule:**
> In **MongoDB Atlas** ➔ **Network Access**, ensure you have added IP `0.0.0.0/0` (*Allow Access from Anywhere*). This permits Vercel cloud serverless instances and mobile devices from any carrier to access the database without IP blocks.

---

## 📡 API Reference

### 1. Create Order
- **Endpoint**: `POST /api/orders`
- **Body**:
  ```json
  {
    "tableNumber": 4,
    "orderReference": "AO-550148",
    "items": [
      { "name": "Tomato & basil bruschetta", "price": 160, "quantity": 1, "note": "Extra basil" }
    ],
    "totalAmount": 160,
    "orderNote": "Please bring water first"
  }
  ```
- **Response**: `201 Created` with order details and reference ID.

### 2. Fetch Order Status
- **Endpoint**: `GET /api/orders/status?orderId=AO-550148&tableNo=4`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "order": {
      "orderId": "AO-550148",
      "tableNo": 4,
      "status": "PREPARING",
      "kitchenAcknowledged": true,
      "items": [...]
    },
    "orders": [...]
  }
  ```

### 3. Kitchen AI Status Callback
- **Endpoint**: `POST /api/integrations/order-status`
- **Headers**: `x-webhook-secret: <SECRET>`
- **Body**:
  ```json
  {
    "externalOrderId": "AO-550148",
    "status": "READY"
  }
  ```

---

## 📄 License
Private & Proprietary — Restaurant System.
