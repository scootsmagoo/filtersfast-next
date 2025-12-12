'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { ArrowLeft, Save } from 'lucide-react';
import type { OptionGroupFormData, OptionRequired, OptionType } from '@/lib/types/product';

interface FormState {
  optionGroupDesc: string;
  optionReq: OptionRequired;
  optionType: OptionType;
  sizingLink: boolean;
  sortOrder: string;
}

export default function NewOptionGroupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormState>({
    optionGroupDesc: '',
    optionReq: 'Y',
    optionType: 'S',
    sizingLink: false,
    sortOrder: '',
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.optionGroupDesc.trim()) {
      errors.optionGroupDesc = 'Description is required';
    } else if (formData.optionGroupDesc.trim().length > 255) {
      errors.optionGroupDesc = 'Description must be 255 characters or fewer';
    }
    if (formData.sortOrder && isNaN(Number(formData.sortOrder))) {
      errors.sortOrder = 'Sort order must be a number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) {
      const alert = document.createElement('div');
      alert.setAttribute('role', 'alert');
      alert.setAttribute('aria-live', 'assertive');
      alert.className = 'sr-only';
      alert.textContent = 'Please correct the highlighted fields.';
      document.body.appendChild(alert);
      setTimeout(() => document.body.removeChild(alert), 1000);
      return;
    }

    const payload: OptionGroupFormData = {
      optionGroupDesc: formData.optionGroupDesc.trim(),
      optionReq: formData.optionReq,
      optionType: formData.optionType,
      sizingLink: formData.sizingLink ? 1 : 0,
      sortOrder: formData.sortOrder ? Number(formData.sortOrder) : 0,
    };

    try {
      setSaving(true);
      const response = await fetch('/api/admin/option-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create option group');
      }
      const created = data.optionGroup;
      const msg = encodeURIComponent('Option group created successfully');
      router.push(`/admin/option-groups/${created.idOptionGroup}?msg=${msg}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create option group';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Option Groups', href: '/admin/option-groups' },
            { label: 'New Option Group', href: '/admin/option-groups/new' },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Option Group</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Define a new collection of options for product customization
            </p>
          </div>
          <Link href="/admin/option-groups">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to list
            </Button>
          </Link>
        </div>

        {error && (
          <div
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Group Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="optionGroupDesc"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Group Description *
                    </label>
                    <input
                      id="optionGroupDesc"
                      type="text"
                      value={formData.optionGroupDesc}
                      onChange={(e) => {
                        setFormData({ ...formData, optionGroupDesc: e.target.value });
                        if (formErrors.optionGroupDesc) {
                          setFormErrors({ ...formErrors, optionGroupDesc: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        formErrors.optionGroupDesc
                          ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-orange'
                      }`}
                      maxLength={255}
                      required
                      aria-invalid={!!formErrors.optionGroupDesc}
                      aria-describedby={formErrors.optionGroupDesc ? 'optionGroupDesc-error' : undefined}
                    />
                    {formErrors.optionGroupDesc && (
                      <p id="optionGroupDesc-error" className="text-xs text-red-600 mt-1" role="alert">
                        {formErrors.optionGroupDesc}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="optionType"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Display Type *
                      </label>
                      <select
                        id="optionType"
                        value={formData.optionType}
                        onChange={(e) => setFormData({ ...formData, optionType: e.target.value as OptionType })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="S">Drop-down List</option>
                        <option value="T">Text Input</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Text inputs capture custom text; lists let shoppers choose a predefined option.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="optionReq"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Required? *
                      </label>
                      <select
                        id="optionReq"
                        value={formData.optionReq}
                        onChange={(e) => setFormData({ ...formData, optionReq: e.target.value as OptionRequired })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="sortOrder"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Sort Order
                      </label>
                      <input
                        id="sortOrder"
                        type="number"
                        min="0"
                        max="9999"
                        value={formData.sortOrder}
                        onChange={(e) => {
                          setFormData({ ...formData, sortOrder: e.target.value });
                          if (formErrors.sortOrder) {
                            setFormErrors({ ...formErrors, sortOrder: '' });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          formErrors.sortOrder
                            ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-orange'
                        }`}
                        aria-invalid={!!formErrors.sortOrder}
                        aria-describedby={formErrors.sortOrder ? 'sortOrder-error' : undefined}
                      />
                      {formErrors.sortOrder && (
                        <p id="sortOrder-error" className="text-xs text-red-600 mt-1" role="alert">
                          {formErrors.sortOrder}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="sizingLink"
                      type="checkbox"
                      checked={formData.sizingLink}
                      onChange={(e) => setFormData({ ...formData, sizingLink: e.target.checked })}
                      className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-gray-300 rounded"
                    />
                    <label
                      htmlFor="sizingLink"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Show sizing/help link next to this option group
                    </label>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Help &amp; Tips
                </h2>
                <ul className="list-disc text-sm text-gray-700 dark:text-gray-300 pl-5 space-y-2">
                  <li>
                    Group similar options (e.g., Size, Color, Pack Quantity) so products can reuse them.
                  </li>
                  <li>Text input groups only support a single option placeholder.</li>
                  <li>
                    Required groups force a selection before checkout; optional groups let shoppers skip.
                  </li>
                  <li>
                    Sort order controls the display sequence alongside other groups assigned to a product.
                  </li>
                </ul>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ready to save this option group?
                  </p>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                    {saving ? 'Saving...' : 'Create Group'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

