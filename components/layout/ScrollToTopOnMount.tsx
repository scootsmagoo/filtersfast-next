'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global component to ensure pages scroll to top on navigation
 * Fixes issue where footer links cause pages to load scrolled down
 */
export default function ScrollToTopOnMount() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top immediately on route change
    window.scrollTo(0, 0);
    
    // Also scroll after a brief delay to handle any layout shifts
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]); // Trigger on pathname change

  return null;
}

