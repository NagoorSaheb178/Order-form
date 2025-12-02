import "./globals.css";
import "../styles/custom.css";
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
      <body style={{ background: "#f3f4f6" }}>
        <OrderProvider>
          {children}
        </OrderProvider>
      </body>
    </html>
  );
}
