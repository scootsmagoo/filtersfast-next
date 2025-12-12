'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import {
  Layers3,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { OptionGroupWithStats } from '@/lib/types/product';

interface OptionGroupListResponse {
  success: boolean;
  optionGroups: OptionGroupWithStats[];
}

export default function OptionGroupsPage() {
  const [optionGroups, setOptionGroups] = useState<OptionGroupWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOptionGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/option-groups');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load option groups');
      }
      const data: OptionGroupListResponse = await response.json();
      setOptionGroups(data.optionGroups || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load option groups';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptionGroups();

    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
      setMessage(decodeURIComponent(msg));
      window.history.replaceState({}, '', window.location.pathname);
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = msg;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  }, []);

  const handleDelete = async (group: OptionGroupWithStats) => {
    if (group.optionCount && group.optionCount > 0) {
      setError('Option groups with options cannot be deleted.');
      return;
    }
    if (group.productCount && group.productCount > 0) {
      setError('Option groups linked to products cannot be deleted.');
      return;
    }
    const confirmed = window.confirm(
      `Delete "${group.optionGroupDesc}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/option-groups/${group.idOptionGroup}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete option group');
      }
      setMessage(`Option group "${group.optionGroupDesc}" was deleted.`);
      loadOptionGroups();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete option group';
      setError(msg);
      const alert = document.createElement('div');
      alert.setAttribute('role', 'alert');
      alert.setAttribute('aria-live', 'assertive');
      alert.className = 'sr-only';
      alert.textContent = msg;
      document.body.appendChild(alert);
      setTimeout(() => document.body.removeChild(alert), 1000);
    }
  };

  const typeLabel = (type: string) => (type === 'T' ? 'Text Input' : 'Drop-down');
  const requiredLabel = (req: string) => (req === 'Y' ? 'Yes' : 'No');

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Option Groups', href: '/admin/option-groups' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Layers3 className="w-8 h-8" aria-hidden="true" />
            Product Option Groups
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage option group definitions used across products
          </p>
        </div>
        <Link href="/admin/option-groups/new">
          <Button aria-label="Create a new option group">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Add Option Group
          </Button>
        </Link>
      </div>

      {message && (
        <div
          className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p className="text-green-800 dark:text-green-200">{message}</p>
        </div>
      )}

      {error && (
        <div
          className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" aria-hidden="true" />
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card className="mb-6">
        {loading ? (
          <div className="p-8 text-center" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400">Loading option groups...</p>
          </div>
        ) : optionGroups.length === 0 ? (
          <div className="p-8 text-center">
            <Layers3 className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No option groups found</p>
            <Link href="/admin/option-groups/new">
              <Button>Add your first option group</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700" role="table">
            <div
              className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800 font-semibold text-sm text-gray-700 dark:text-gray-300"
              role="row"
            >
              <div className="col-span-4" role="columnheader">Group</div>
              <div className="col-span-1 text-center" role="columnheader">Type</div>
              <div className="col-span-1 text-center" role="columnheader">Required</div>
              <div className="col-span-1 text-center" role="columnheader">Sort</div>
              <div className="col-span-1 text-center" role="columnheader">Options</div>
              <div className="col-span-1 text-center" role="columnheader">Products</div>
              <div className="col-span-3 text-right" role="columnheader">Actions</div>
            </div>
            {optionGroups.map((group) => (
              <div
                key={group.idOptionGroup}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-sm"
                role="row"
              >
                <div className="col-span-4">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {group.optionGroupDesc}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    ID: {group.idOptionGroup}
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">
                    {typeLabel(group.optionType)}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700">
                    {requiredLabel(group.optionReq)}
                  </span>
                </div>
                <div className="col-span-1 text-center text-gray-600 dark:text-gray-300">
                  {group.sortOrder ?? '-'}
                </div>
                <div className="col-span-1 text-center text-gray-600 dark:text-gray-300">
                  {group.optionCount ?? 0}
                </div>
                <div className="col-span-1 text-center text-gray-600 dark:text-gray-300">
                  {group.productCount ?? 0}
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <Link href={`/admin/option-groups/${group.idOptionGroup}`}>
                    <Button variant="outline" size="sm" aria-label={`Edit ${group.optionGroupDesc}`}>
                      <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${group.optionGroupDesc}`}
                    onClick={() => handleDelete(group)}
                    disabled={(group.optionCount ?? 0) > 0 || (group.productCount ?? 0) > 0}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" aria-hidden="true" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-brand-orange" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Option Group Guidelines</h2>
        </div>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
          <li>
            Option groups organize related options (e.g., Size, Color) and are linked to products from the product editor.
          </li>
          <li>
            Text input groups (Type = Text Input) can store customer-provided text and may only contain a single option placeholder.
          </li>
          <li>
            Required groups force shoppers to choose an option before adding to cart; optional groups let them skip selection.
          </li>
          <li>
            Deleting a group is only allowed when it has zero options and zero product assignments—unlink items first.
          </li>
          <li>
            Use sort order to control display sequence; groups with matching sort values fall back to alphabetical order.
          </li>
        </ul>
      </Card>
    </div>
  );
}

