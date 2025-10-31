'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user has admin access via an admin API endpoint
      const response = await fetch('/api/admin/partners');
      
      if (response.status === 403) {
        // Not an admin - redirect to home
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to verify admin access');
      }

      // User is admin
      setIsAdmin(true);
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Router will redirect
  }

  return <>{children}</>;
}

