'use client';

import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

/**
 * ARIA Live Region Component
 * 
 * Announces dynamic content changes to screen readers.
 * Use 'polite' for non-critical updates (default).
 * Use 'assertive' for urgent messages (errors, alerts).
 */
export default function LiveRegion({ 
  message, 
  priority = 'polite',
  className = '' 
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Clear and set message to ensure announcement
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    />
  );
}

