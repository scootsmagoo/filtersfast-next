'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import LiveRegion from './LiveRegion';

interface StatusAnnouncementContextType {
  announceStatus: (message: string) => void;
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
}

const StatusAnnouncementContext = createContext<StatusAnnouncementContextType | null>(null);

/**
 * Global Status Announcement Provider
 * 
 * Provides functions to announce status updates to screen readers
 * throughout the application.
 * 
 * Usage:
 * const { announceSuccess, announceError } = useStatusAnnouncement();
 * announceSuccess('Item added to cart');
 * announceError('Failed to load products');
 */
export function StatusAnnouncementProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announceStatus = useCallback((message: string) => {
    setPoliteMessage(message);
    // Clear after announcement
    setTimeout(() => setPoliteMessage(''), 3000);
  }, []);

  const announceError = useCallback((message: string) => {
    setAssertiveMessage(message);
    // Clear after announcement
    setTimeout(() => setAssertiveMessage(''), 3000);
  }, []);

  const announceSuccess = useCallback((message: string) => {
    setPoliteMessage(message);
    // Clear after announcement
    setTimeout(() => setPoliteMessage(''), 3000);
  }, []);

  return (
    <StatusAnnouncementContext.Provider value={{ announceStatus, announceError, announceSuccess }}>
      {children}
      {/* Polite announcements (non-urgent) */}
      <LiveRegion message={politeMessage} priority="polite" />
      {/* Assertive announcements (urgent/errors) */}
      <LiveRegion message={assertiveMessage} priority="assertive" />
    </StatusAnnouncementContext.Provider>
  );
}

export function useStatusAnnouncement() {
  const context = useContext(StatusAnnouncementContext);
  if (!context) {
    throw new Error('useStatusAnnouncement must be used within StatusAnnouncementProvider');
  }
  return context;
}

