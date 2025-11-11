'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { DealFormData } from '@/lib/types/deal';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function NewDealPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<DealFormData>({
    dealdiscription: '',
    startprice: 0,
    endprice: 0,
    units: 0,
    active: 1,
    validFrom: null,
    validTo: null,
    rewardSkus: '',
    rewardAutoAdd: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};

    if (!formData.dealdiscription.trim()) {
      newErrors.dealdiscription = 'Deal description is required';
    }

    if (formData.endprice < formData.startprice) {
      newErrors.endprice = 'End price must be greater than or equal to start price';
    }

    if (formData.units < 0) {
      newErrors.units = 'Units must be 0 or greater';
    }

    if (formData.validFrom && formData.validTo) {
      const fromDate = new Date(formData.validFrom);
      const toDate = new Date(formData.validTo);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        newErrors.validTo = 'Invalid date format';
      } else if (toDate < fromDate) {
        newErrors.validTo = 'End date must be after start date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus on first error field
      const firstErrorField = document.getElementById(Object.keys(newErrors)[0]);
      if (firstErrorField) {
        firstErrorField.focus();
      }
      // Announce errors to screen readers
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = 'Form has errors. Please review and correct.';
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
      return;
    }
    
    setSaving(true);

    try {
      const response = await fetch('/api/admin/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deal');
      }

      const data = await response.json();
      router.push(`/admin/deals?msg=${encodeURIComponent('Deal created successfully')}`);
    } catch (error) {
      console.error('Error creating deal:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create deal';
      // Use accessible error notification
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = errorMsg;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        <AdminBreadcrumb 
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Deals', href: '/admin/deals' },
            { label: 'New Deal', href: '/admin/deals/new' }
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Create New Deal
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">
              Add a new special offer based on cart total
            </p>
          </div>
          <Link href="/admin/deals">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">
                    Deal Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label 
                        htmlFor="dealdiscription"
                        className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        Description *
                      </label>
                      <input
                        id="dealdiscription"
                        type="text"
                        value={formData.dealdiscription}
                        onChange={(e) => {
                          setFormData({ ...formData, dealdiscription: e.target.value });
                          if (errors.dealdiscription) {
                            setErrors({ ...errors, dealdiscription: '' });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors ${
                          errors.dealdiscription 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                        placeholder="e.g., Buy $50-$100, Get 1 Free"
                        maxLength={100}
                        required
                        aria-required="true"
                        aria-describedby="dealdiscription-help dealdiscription-error"
                        aria-invalid={!!errors.dealdiscription}
                      />
                      <p id="dealdiscription-help" className="text-xs text-gray-500 mt-1">
                        Brief description for your reference
                      </p>
                      {errors.dealdiscription && (
                        <p id="dealdiscription-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                          {errors.dealdiscription}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label 
                          htmlFor="startprice"
                          className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                        >
                          Start Price ($) *
                        </label>
                        <input
                          id="startprice"
                          type="number"
                          step="0.01"
                          min="0"
                          max="999999.99"
                          value={formData.startprice}
                          onChange={(e) => setFormData({ ...formData, startprice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="0.00"
                          required
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <label 
                          htmlFor="endprice"
                          className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                        >
                          End Price ($) *
                        </label>
                        <input
                          id="endprice"
                          type="number"
                          step="0.01"
                          min="0"
                          max="999999.99"
                          value={formData.endprice}
                          onChange={(e) => {
                            setFormData({ ...formData, endprice: parseFloat(e.target.value) || 0 });
                            if (errors.endprice) {
                              setErrors({ ...errors, endprice: '' });
                            }
                          }}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors ${
                            errors.endprice 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-700'
                          }`}
                          placeholder="0.00"
                          required
                          aria-required="true"
                          aria-invalid={!!errors.endprice}
                          aria-describedby={errors.endprice ? 'endprice-error' : undefined}
                        />
                        {errors.endprice && (
                          <p id="endprice-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                            {errors.endprice}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label 
                        htmlFor="units"
                        className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        Free Units *
                      </label>
                      <input
                        id="units"
                        type="number"
                        min="0"
                        max="999"
                        value={formData.units}
                        onChange={(e) => {
                          setFormData({ ...formData, units: parseInt(e.target.value) || 0 });
                          if (errors.units) {
                            setErrors({ ...errors, units: '' });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors ${
                          errors.units 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                        placeholder="0"
                        required
                        aria-required="true"
                        aria-describedby="units-help units-error"
                        aria-invalid={!!errors.units}
                      />
                      <p id="units-help" className="text-xs text-gray-500 mt-1">
                        Number of units (products) customer receives for free when cart total is within price range
                      </p>
                      {errors.units && (
                        <p id="units-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                          {errors.units}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="rewardSkus"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      Reward SKUs
                    </label>
                    <textarea
                      id="rewardSkus"
                      value={formData.rewardSkus || ''}
                      onChange={(e) => setFormData({ ...formData, rewardSkus: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors font-mono text-sm"
                      placeholder="SKU123*1&#10;SKU456*2@0"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter one reward per line. Use <code className="font-mono">SKU*quantity</code> and optional <code className="font-mono">@price</code>.
                      Leave empty to skip auto-added rewards.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="rewardAutoAdd"
                      type="checkbox"
                      checked={formData.rewardAutoAdd === 1}
                      onChange={(e) => setFormData({ ...formData, rewardAutoAdd: e.target.checked ? 1 : 0 })}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <label htmlFor="rewardAutoAdd" className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                      Automatically add rewards to qualifying carts
                    </label>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">
                    Schedule (Optional)
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label 
                        htmlFor="validFrom"
                        className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        Valid From
                      </label>
                      <input
                        id="validFrom"
                        type="datetime-local"
                        value={formData.validFrom || ''}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                        aria-describedby="validFrom-help"
                      />
                      <p id="validFrom-help" className="text-xs text-gray-500 mt-1">
                        Leave empty for no start date limit
                      </p>
                    </div>
                    <div>
                      <label 
                        htmlFor="validTo"
                        className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        Valid To
                      </label>
                      <input
                        id="validTo"
                        type="datetime-local"
                        value={formData.validTo || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, validTo: e.target.value || null });
                          if (errors.validTo) {
                            setErrors({ ...errors, validTo: '' });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors ${
                          errors.validTo 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                        aria-describedby="validTo-help validTo-error"
                        aria-invalid={!!errors.validTo}
                      />
                      <p id="validTo-help" className="text-xs text-gray-500 mt-1">
                        Leave empty for no end date limit
                      </p>
                      {errors.validTo && (
                        <p id="validTo-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                          {errors.validTo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">
                    Status
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="active" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="active"
                          type="checkbox"
                          checked={formData.active === 1}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                          className="w-4 h-4"
                          aria-describedby="active-help"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                          Active
                        </span>
                      </label>
                      <p id="active-help" className="text-xs text-gray-500 mt-1">
                        Only active deals will be applied to carts
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Creating...' : 'Create Deal'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

