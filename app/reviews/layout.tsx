import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Reviews | FiltersFast',
  description: 'Read verified customer reviews and ratings for FiltersFast. See what our customers say about our air filters, water filters, and excellent service.',
  openGraph: {
    title: 'Customer Reviews | FiltersFast',
    description: 'Read verified customer reviews and ratings for FiltersFast. See what our customers say about our air filters, water filters, and excellent service.',
  },
};

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

