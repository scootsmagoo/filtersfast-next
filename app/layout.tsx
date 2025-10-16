import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "FiltersFast - America's Top Online Filtration Retailer",
  description: "Huge Selection. Unbeatable Quality. 365-Day Returns. Shop refrigerator water filters, air filters, pool filters, and more from trusted brands.",
  keywords: "water filters, air filters, refrigerator filters, HVAC filters, pool filters, FiltersFast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

