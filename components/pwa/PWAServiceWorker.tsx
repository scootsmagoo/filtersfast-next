'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa-utils';

export default function PWAServiceWorker() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();

    // Listen for service worker update events
    const handleUpdateAvailable = () => {
      // You can show a toast notification here if needed
      console.log('Service worker update available');
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  return null;
}

