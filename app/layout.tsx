import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTopOnMount from "@/components/layout/ScrollToTopOnMount";
import { CartProvider } from "@/lib/cart-context";
import ScreenReaderAnnouncements from "@/components/ui/ScreenReaderAnnouncements";
import { StatusAnnouncementProvider } from "@/components/ui/StatusAnnouncementProvider";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import { Suspense } from "react";
import ReferralTracker from "@/components/tracking/ReferralTracker";
import { ThemeProvider } from "@/lib/theme-provider";

const lato = Lato({ 
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FiltersFast - America's Top Online Filtration Retailer",
  description: "Huge Selection. Unbeatable Quality. 365-Day Returns. Shop refrigerator water filters, air filters, pool filters, and more from trusted brands.",
  keywords: "water filters, air filters, refrigerator filters, HVAC filters, pool filters, FiltersFast",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: "FiltersFast - America's Top Online Filtration Retailer",
    description: "Huge Selection. Unbeatable Quality. 365-Day Returns. Shop refrigerator water filters, air filters, pool filters, and more from trusted brands.",
    url: 'https://www.filtersfast.com',
    siteName: 'FiltersFast',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.filtersfast.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FiltersFast - America\'s Top Online Filtration Retailer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: "FiltersFast - America's Top Online Filtration Retailer",
    description: "Huge Selection. Unbeatable Quality. 365-Day Returns. Shop water filters, air filters, and more!",
    images: ['https://www.filtersfast.com/og-image.jpg'],
    creator: '@FiltersFast',
    site: '@FiltersFast'
  },
  alternates: {
    canonical: 'https://www.filtersfast.com'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="transition-colors">
      <body className={`${lato.className} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors`}>
        <ThemeProvider>
          <StatusAnnouncementProvider>
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
            
            <ScrollToTopOnMount />
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            <Header />
            <main id="main-content" className="min-h-screen bg-white dark:bg-gray-900 transition-colors" role="main">
              {children}
            </main>
            <Footer />
            <ScreenReaderAnnouncements />
            <ChatbotWidget />
            </CartProvider>
          </StatusAnnouncementProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

