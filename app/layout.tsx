import "./globals.css";
import "../styles/custom.css";
import type { Metadata } from "next";
<<<<<<< HEAD

export const metadata: Metadata = {
  title: "Aster & Olive — Dine-in ordering",
  description: "Dine-in ordering directly from our seasonal menu.",
=======
import { OrderProvider } from "@/components/OrderContext";

export const metadata: Metadata = {
  title: "Restaurant QR Ordering",
  description: "Scan, order, and enjoy.",
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
=======
      <body style={{ background: "#f3f4f6" }}>
        <OrderProvider>
          {children}
        </OrderProvider>
      </body>
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
    </html>
  );
}
