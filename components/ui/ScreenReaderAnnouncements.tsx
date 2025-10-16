'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-context';

export default function ScreenReaderAnnouncements() {
  const { state: cart } = useCart();
  const announcementRef = useRef<HTMLDivElement>(null);
  const previousItemCount = useRef(cart.itemCount);

  useEffect(() => {
    // Announce cart changes to screen readers
    if (previousItemCount.current !== cart.itemCount) {
      const message = cart.itemCount === 0 
        ? 'Cart is now empty'
        : cart.itemCount === 1
        ? '1 item added to cart'
        : `${cart.itemCount} items in cart`;
      
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
      
      previousItemCount.current = cart.itemCount;
    }
  }, [cart.itemCount]);

  return (
    <div
      ref={announcementRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  );
}
