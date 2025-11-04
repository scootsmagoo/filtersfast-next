/**
 * Admin Breadcrumb Navigation Component
 * Provides consistent back-navigation across all admin pages
 */

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LayoutDashboard } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
}

export default function AdminBreadcrumb({ items = [] }: AdminBreadcrumbProps) {
  // Simple approach: just show "Back to Admin Dashboard" button
  // This is clearer and more consistent than complex breadcrumbs
  
  return (
    <div className="mb-4">
      <Link href="/admin">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Back to Admin Dashboard
        </Button>
      </Link>
      {items.length > 0 && (
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <LayoutDashboard className="w-3 h-3" />
          <span>Admin</span>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.href} className="flex items-center gap-2">
                <span>/</span>
                <Link href={item.href} className="hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1">
                  {Icon && <Icon className="w-3 h-3" />}
                  {item.label}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

