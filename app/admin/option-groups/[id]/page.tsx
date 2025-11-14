'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import type {
  OptionGroupFormData,
  OptionGroupWithStats,
  OptionRequired,
  OptionType,
  Option,
} from '@/lib/types/product';

interface OptionGroupResponse {
  success: boolean;
  optionGroup: OptionGroupWithStats;
}

interface OptionsResponse {
  success: boolean;
  optionGroup?: OptionGroupWithStats;
  options: Option[];
  availableOptions: Option[];
}

interface FormState {
  optionGroupDesc: string;
  optionReq: OptionRequired;
  optionType: OptionType;
  sizingLink: boolean;
  sortOrder: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export default function EditOptionGroupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [group, setGroup] = useState<OptionGroupWithStats | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [availableOptions, setAvailableOptions] = useState<Option[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormState>({
    optionGroupDesc: '',
    optionReq: 'Y',
    optionType: 'S',
    sizingLink: false,
    sortOrder: '',
  });
  const [selectedOption, setSelectedOption] = useState('');
  const [excludeAll, setExcludeAll] = useState(false);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [optionActionLoading, setOptionActionLoading] = useState(false);

  const loadOptionGroup = async () => {
    const response = await fetch(`/api/admin/option-groups/${params.id}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load option group');
    }
    const data: OptionGroupResponse = await response.json();
    setGroup(data.optionGroup);
    setFormData({
      optionGroupDesc: data.optionGroup.optionGroupDesc,
      optionReq: data.optionGroup.optionReq,
      optionType: data.optionGroup.optionType,
      sizingLink: data.optionGroup.sizingLink === 1,
      sortOrder:
        data.optionGroup.sortOrder === null || data.optionGroup.sortOrder === undefined
          ? ''
          : String(data.optionGroup.sortOrder),
    });
  };

  const loadOptions = async () => {
    const response = await fetch(`/api/admin/option-groups/${params.id}/options`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load group options');
    }
    const data: OptionsResponse = await response.json();
    setOptions(data.options || []);
    setAvailableOptions(data.availableOptions || []);
    if (data.optionGroup) {
      setGroup(data.optionGroup);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await Promise.all([loadOptionGroup(), loadOptions()]);
        const paramsObj = new URLSearchParams(window.location.search);
        const msg = paramsObj.get('msg');
        if (msg) {
          setMessage(decodeURIComponent(msg));
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load option group';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.optionGroupDesc.trim()) {
      errors.optionGroupDesc = 'Description is required';
    } else if (formData.optionGroupDesc.trim().length > 255) {
      errors.optionGroupDesc = 'Description must be 255 characters or fewer';
    }
    if (formData.sortOrder && isNaN(Number(formData.sortOrder))) {
      errors.sortOrder = 'Sort order must be numeric';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) {
      return;
    }
    const payload: Partial<OptionGroupFormData> = {
      optionGroupDesc: formData.optionGroupDesc.trim(),
      optionReq: formData.optionReq,
      optionType: formData.optionType,
      sizingLink: formData.sizingLink ? 1 : 0,
      sortOrder: formData.sortOrder ? Number(formData.sortOrder) : 0,
    };
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/option-groups/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update option group');
      }
      setGroup(data.optionGroup);
      setMessage('Option group updated successfully');
      await loadOptions();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update option group';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    const confirmed = window.confirm(
      `Delete "${group.optionGroupDesc}"? This cannot be undone and requires the group to be unused.`
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/option-groups/${group.idOptionGroup}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete option group');
      }
      const msg = encodeURIComponent('Option group deleted.');
      router.push(`/admin/option-groups?msg=${msg}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete option group';
      setError(msg);
    }
  };

  const handleAddOption = async () => {
    if (!selectedOption) {
      setOptionError('Select an option to add');
      return;
    }
    setOptionError(null);
    try {
      setOptionActionLoading(true);
      const response = await fetch(`/api/admin/option-groups/${params.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idOption: selectedOption, excludeAll }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add option');
      }
      setOptions(data.options || []);
      setAvailableOptions(data.availableOptions || []);
      if (data.optionGroup) {
        setGroup(data.optionGroup);
      }
      setSelectedOption('');
      setExcludeAll(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add option to group';
      setOptionError(msg);
    } finally {
      setOptionActionLoading(false);
    }
  };

  const handleRemoveOption = async (optionId: string) => {
    const confirmed = window.confirm('Remove this option from the group?');
    if (!confirmed) return;
    try {
      setOptionActionLoading(true);
      const response = await fetch(
        `/api/admin/option-groups/${params.id}/options/${optionId}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove option');
      }
      setOptions(data.options || []);
      setAvailableOptions(data.availableOptions || []);
      if (data.optionGroup) {
        setGroup(data.optionGroup);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove option';
      setOptionError(msg);
    } finally {
      setOptionActionLoading(false);
    }
  };

  const reachedTextLimit =
    group?.optionType === 'T' && options.length >= 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading option group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Option group not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Option Groups', href: '/admin/option-groups' },
            { label: group.optionGroupDesc, href: `/admin/option-groups/${group.idOptionGroup}` },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Option Group
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update group settings and manage linked options
            </p>
          </div>
          <Link href="/admin/option-groups">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to list
            </Button>
          </Link>
        </div>

        {message && (
          <div
            className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            role="status"
          >
            {message}
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
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
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 ${
                        formErrors.optionGroupDesc
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                      maxLength={255}
                      required
                      aria-invalid={!!formErrors.optionGroupDesc}
                    />
                    {formErrors.optionGroupDesc && (
                      <p className="text-xs text-red-600 mt-1" role="alert">
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
                      {group.optionType === 'T' && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" aria-hidden="true" />
                          Text inputs are limited to a single option placeholder.
                        </p>
                      )}
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
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 ${
                          formErrors.sortOrder ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                        }`}
                        aria-invalid={!!formErrors.sortOrder}
                      />
                      {formErrors.sortOrder && (
                        <p className="text-xs text-red-600 mt-1" role="alert">
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
                    <label htmlFor="sizingLink" className="text-sm text-gray-700 dark:text-gray-300">
                      Show sizing/help link when this group is displayed
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Options in this Group
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {options.length} linked
                  </span>
                </div>

                {options.length === 0 ? (
                  <div className="p-4 text-center text-gray-600 dark:text-gray-300 border border-dashed rounded-lg">
                    No options linked yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {options.map((opt) => (
                      <div key={opt.idOption} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {opt.optionDescrip}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-4">
                            <span>{currencyFormatter.format(opt.priceToAdd || 0)}</span>
                            <span>{opt.percToAdd || 0}%</span>
                            <span>Sort: {opt.sortOrder ?? '-'}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(opt.idOption)}
                          disabled={optionActionLoading}
                          aria-label={`Remove ${opt.optionDescrip}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Add existing option
                  </h3>
                  {reachedTextLimit ? (
                    <p className="text-sm text-amber-600">
                      This text-input group already has its single allowed option. Remove it before adding a new one.
                    </p>
                  ) : availableOptions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      All options are already linked to this group. Create more options first.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <label
                        htmlFor="availableOptionSelect"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Select an option to add
                      </label>
                      <select
                        id="availableOptionSelect"
                        aria-describedby="availableOptionHelp"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                        value={selectedOption}
                        onChange={(e) => {
                          setSelectedOption(e.target.value);
                          setOptionError(null);
                        }}
                        disabled={optionActionLoading}
                      >
                        <option value="">Select an option</option>
                        {availableOptions.map((opt) => (
                          <option key={opt.idOption} value={opt.idOption}>
                            {opt.optionDescrip}
                          </option>
                        ))}
                      </select>
                      <p
                        id="availableOptionHelp"
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        Options already linked to this group are hidden from the list.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          id="excludeAll"
                          type="checkbox"
                          checked={excludeAll}
                          onChange={(e) => setExcludeAll(e.target.checked)}
                          className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-gray-300 rounded"
                        />
                        <label htmlFor="excludeAll" className="text-sm text-gray-700 dark:text-gray-300">
                          Exclude this option from all linked products after adding
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleAddOption}
                          disabled={optionActionLoading || !selectedOption}
                        >
                          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}
                  {optionError && (
                    <p className="text-sm text-red-600 mt-2" role="alert">
                      {optionError}
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Group Status
                </h3>
                <dl className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <dt>Required?</dt>
                    <dd className="font-semibold">{group.optionReq === 'Y' ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Type</dt>
                    <dd className="font-semibold">
                      {group.optionType === 'T' ? 'Text Input' : 'Drop-down'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Sizing Link</dt>
                    <dd className="font-semibold">{group.sizingLink === 1 ? 'Enabled' : 'Hidden'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Options linked</dt>
                    <dd className="font-semibold">{group.optionCount ?? options.length}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Products linked</dt>
                    <dd className="font-semibold">{group.productCount ?? 0}</dd>
                  </div>
                </dl>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-4 text-red-600"
                  disabled={(group.optionCount ?? 0) > 0 || (group.productCount ?? 0) > 0}
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Delete Group
                </Button>
                {(group.optionCount ?? 0) > 0 || (group.productCount ?? 0) > 0 ? (
                  <p className="text-xs text-gray-500 mt-2">
                    Remove all options and unlink products before deleting.
                  </p>
                ) : null}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Tips
                </h3>
                <ul className="list-disc text-sm text-gray-700 dark:text-gray-300 pl-5 space-y-2">
                  <li>Option counts update automatically as you add or remove options.</li>
                  <li>
                    Use the exclusion toggle when adding a new option to keep it disabled for all
                    existing products until you explicitly enable it.
                  </li>
                  <li>
                    Text input groups only need a single placeholder option; the shopper provides the actual text at checkout.
                  </li>
                  <li>
                    Sort order helps coordinate display priority across multiple groups on the product page.
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

