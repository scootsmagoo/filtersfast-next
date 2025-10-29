'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-context';

export default function ScreenReaderAnnouncements() {
  const { itemCount } = useCart();
  const announcementRef = useRef<HTMLDivElement>(null);
  const previousItemCount = useRef(itemCount);

  useEffect(() => {
    // Announce cart changes to screen readers
    if (previousItemCount.current !== itemCount) {
      const message = itemCount === 0 
        ? 'Cart is now empty'
        : itemCount === 1
        ? '1 item added to cart'
        : `${itemCount} items in cart`;
      
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
      
      previousItemCount.current = itemCount;
    }
  }, [itemCount]);

  return (
    <div
      ref={announcementRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  );
}
