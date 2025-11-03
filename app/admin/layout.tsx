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
      // Check if user has admin access via dedicated verification endpoint
      const response = await fetch('/api/admin/verify');
      
      if (response.status === 401) {
        // Not authenticated - redirect to sign in
        router.push('/sign-in?redirect=/admin');
        return;
      }

      if (response.status === 403) {
        // Not an admin - redirect to home
        router.push('/');
        return;
      }

      if (!response.ok) {
        // Other error - redirect to home
        console.error('Failed to verify admin access');
        router.push('/');
        return;
      }

      const data = await response.json();
      
      if (data.isAdmin) {
        // User is admin
        setIsAdmin(true);
      } else {
        // Not an admin
        router.push('/');
      }
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

