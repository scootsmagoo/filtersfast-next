import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart-context";
import ScreenReaderAnnouncements from "@/components/ui/ScreenReaderAnnouncements";

export const metadata: Metadata = {
  title: "FiltersFast - America's Top Online Filtration Retailer",
  description: "Huge Selection. Unbeatable Quality. 365-Day Returns. Shop refrigerator water filters, air filters, pool filters, and more from trusted brands.",
  keywords: "water filters, air filters, refrigerator filters, HVAC filters, pool filters, FiltersFast",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider>
          {/* Skip Links */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-orange text-white px-4 py-2 rounded z-50"
          >
            Skip to main content
          </a>
          <a 
            href="#main-navigation" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 bg-brand-orange text-white px-4 py-2 rounded z-50"
          >
            Skip to navigation
          </a>
          
          <Header />
          <main id="main-content" className="min-h-screen" role="main">
            {children}
          </main>
          <Footer />
          <ScreenReaderAnnouncements />
        </CartProvider>
      </body>
    </html>
  );
}

