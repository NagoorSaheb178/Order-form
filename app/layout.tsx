import "./globals.css";
import "../styles/custom.css";   // ✅ ADD THIS LINE
import type { Metadata } from "next";
import { OrderProvider } from "@/components/OrderContext";

export const metadata: Metadata = {
  title: "Restaurant QR Ordering",
  description: "Scan, order, and enjoy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <OrderProvider>
          <div className="min-h-screen flex items-center justify-center px-3">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4">
              {children}
            </div>
          </div>
        </OrderProvider>
      </body>
    </html>
  );
}
