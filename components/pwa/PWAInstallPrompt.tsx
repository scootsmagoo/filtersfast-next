'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import {
  canInstall,
  getDeferredPrompt,
  isInstalled,
  showInstallPrompt,
  setDeferredPrompt,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa-utils';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  const handleInstall = useCallback(async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowPrompt(false);
    }
  }, []);

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled()) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (!isNaN(dismissedTime)) {
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return;
        }
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check if we can install (in case event was missed)
    const checkInstallability = () => {
      if (canInstall()) {
        setShowPrompt(true);
      }
    };

    // Check after a delay to allow service worker to register
    const timeout = setTimeout(checkInstallability, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timeout);
    };
  }, []);

  // Handle focus management and keyboard trap
  useEffect(() => {
    if (!showPrompt || !dialogRef.current) {
      return;
    }

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus first focusable element in dialog
    const firstButton = dialogRef.current.querySelector('button') as HTMLElement;
    if (firstButton) {
      firstButton.focus();
    }

    // Handle ESC key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    // Trap focus within dialog
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleTab);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleTab);
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [showPrompt, handleDismiss]);

  if (!showPrompt || isDismissed || isInstalled()) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-brand-orange rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3
            id="pwa-install-title"
            className="text-lg font-semibold text-gray-900 dark:text-white mb-1"
          >
            Install FiltersFast App
          </h3>
          <p
            id="pwa-install-description"
            className="text-sm text-gray-600 dark:text-gray-300 mb-3"
          >
            Install our app for a faster, more convenient shopping experience. Get quick access to
            deals, order updates, and more.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-brand-orange text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
          aria-label="Dismiss install prompt"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

