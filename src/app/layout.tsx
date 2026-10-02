import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import "./elements.css";
import "./shop.css";
import "./services.css";
import "./interface.css";
import "./navigation.css";
import "./overlays.css";
import "./mobile.css";
import "./cinematic.css";
import CartProvider from "@/components/cart-provider";

export const metadata: Metadata = {
  title: "Makeon — Cafea bună. Apă pură. Zile mai bune.",
  description:
    "Cafea de specialitate, espressoare, apă filtrată și abonamente pentru biroul tău. Două lumi, aceeași grijă. Descoperă Makeon.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
