'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface SKUCompatibility {
  id: number;
  idProduct: number;
  skuBrand: string;
  skuValue: string;
  createdAt: string;
  updatedAt: string;
}

interface SKUCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName?: string;
  pairedProductId?: number;
  onSave?: () => void;
}

export default function SKUCompatibilityModal({
  isOpen,
  onClose,
  productId,
  productName,
  pairedProductId,
  onSave
}: SKUCompatibilityModalProps) {
  const [compatibilities, setCompatibilities] = useState<SKUCompatibility[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'parts' | 'models'>('parts');
  const [parentCompatibilities, setParentCompatibilities] = useState<SKUCompatibility[]>([]);
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);
  const [previousActiveElement, setPreviousActiveElement] = useState<HTMLElement | null>(null);

  // Load compatibilities when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      loadCompatibilities();
      if (pairedProductId) {
        loadParentCompatibilities();
      }
    }
  }, [isOpen, productId, pairedProductId]);

  const loadCompatibilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/products/${productId}/compatibility`);
      const data = await response.json();

      if (data.success) {
        setCompatibilities(data.compatibilities || []);
      } else {
        setError(data.error || 'Failed to load compatibilities');
      }
    } catch (err) {
      console.error('Error loading compatibilities:', err);
      setError('Failed to load compatibilities');
    } finally {
      setLoading(false);
    }
  };

  const loadParentCompatibilities = async () => {
    if (!pairedProductId) return;
    
    try {
      const response = await fetch(`/api/admin/products/${pairedProductId}/compatibility`);
      const data = await response.json();

      if (data.success) {
        setParentCompatibilities(data.compatibilities || []);
      }
    } catch (err) {
      console.error('Error loading parent compatibilities:', err);
    }
  };

  const handleAddSKU = () => {
    setCompatibilities([
      ...compatibilities,
      {
        id: Date.now(), // Temporary ID for new items
        idProduct: productId,
        skuBrand: '',
        skuValue: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  };

  const handleRemoveSKU = (id: number) => {
    if (window.confirm('Are you sure you want to delete this compatibility record?')) {
      // If it's a real ID (positive number), delete from server
      if (id > 0 && id < 1000000) {
        deleteCompatibility(id);
      } else {
        // Remove from local state (new, unsaved item)
        setCompatibilities(compatibilities.filter(c => c.id !== id));
      }
    }
  };

  const deleteCompatibility = async (id: number) => {
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/compatibility?compatibilityId=${id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        // Announce deletion to screen readers
        const statusEl = document.getElementById('compatibility-status');
        if (statusEl) {
          statusEl.textContent = 'Compatibility record deleted successfully.';
        }
        // Reload compatibilities
        loadCompatibilities();
      } else {
        setError(data.error || 'Failed to delete compatibility');
      }
    } catch (err) {
      console.error('Error deleting compatibility:', err);
      setError('Failed to delete compatibility');
    }
  };

  const handleUpdateField = (id: number, field: 'skuBrand' | 'skuValue', value: string) => {
    // Sanitize input: remove any HTML tags and limit length
    const sanitized = value.replace(/<[^>]*>/g, '').substring(0, 100);
    setCompatibilities(
      compatibilities.map(c =>
        c.id === id ? { ...c, [field]: sanitized } : c
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate all entries have both brand and SKU
      const invalid = compatibilities.find(
        c => !c.skuBrand.trim() || !c.skuValue.trim()
      );

      if (invalid) {
        setError('All compatibility entries must have both Brand and SKU');
        return;
      }

      // Prepare data for bulk update
      const compatibilitiesData = compatibilities.map(c => ({
        id: c.id > 0 && c.id < 1000000 ? c.id : undefined,
        skuBrand: c.skuBrand.trim(),
        skuValue: c.skuValue.trim()
      }));

      const response = await fetch(`/api/admin/products/${productId}/compatibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compatibilities: compatibilitiesData })
      });

      const data = await response.json();

      if (data.success) {
        setCompatibilities(data.compatibilities || []);
        // Announce success to screen readers
        const statusEl = document.getElementById('compatibility-status');
        if (statusEl) {
          statusEl.textContent = 'Compatibility changes saved successfully.';
        }
        if (onSave) {
          onSave();
        }
        // Close modal after successful save (small delay for screen reader)
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        setError(data.error || 'Failed to save compatibilities');
      }
    } catch (err) {
      console.error('Error saving compatibilities:', err);
      setError('Failed to save compatibilities');
    } finally {
      setSaving(false);
    }
  };

  const handleMergeParts = async () => {
    if (!pairedProductId) return;
    
    if (!window.confirm('Are you sure you want to merge compatible parts to the parent product? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save current changes first
      await handleSave();

      // Merge compatibilities
      const response = await fetch(
        `/api/admin/products/${productId}/compatibility?mergeToProductId=${pairedProductId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        // Announce merge to screen readers
        const statusEl = document.getElementById('compatibility-status');
        if (statusEl) {
          statusEl.textContent = `Successfully merged ${data.merged || 0} compatibility records to parent product.`;
        }
        // Reload parent compatibilities
        loadParentCompatibilities();
        // Reload current compatibilities (should be empty now)
        loadCompatibilities();
      } else {
        setError(data.error || 'Failed to merge compatibilities');
      }
    } catch (err) {
      console.error('Error merging compatibilities:', err);
      setError('Failed to merge compatibilities');
    } finally {
      setSaving(false);
    }
  };

  // Handle ESC key and focus management
  useEffect(() => {
    if (!isOpen) {
      // Return focus to previous element when modal closes
      if (previousActiveElement) {
        previousActiveElement.focus();
        setPreviousActiveElement(null);
      }
      return;
    }
    
    // Store current active element (only once when modal opens)
    const activeEl = document.activeElement as HTMLElement;
    setPreviousActiveElement(activeEl);
    
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Focus trap: Handle Tab key to keep focus within modal
    const handleTab = (e: globalThis.KeyboardEvent) => {
      if (!modalRef) return;
      
      const focusableElements = modalRef.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    
    // Focus first focusable element when modal opens
    setTimeout(() => {
      if (modalRef) {
        const firstFocusable = modalRef.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, 100);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, modalRef]);

  if (!isOpen) return null;

  const isPaired = !!pairedProductId;
  const canEdit = !isPaired; // Only editable if not a paired product

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="compatibility-modal-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          ref={setModalRef}
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors"
          role="document"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 id="compatibility-modal-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                Product Compatibility
              </h2>
              {productName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                  {productName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
              type="button"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Compatibility views">
            <button
              onClick={() => setView('parts')}
              role="tab"
              aria-selected={view === 'parts'}
              aria-controls="parts-panel"
              id="parts-tab"
              className={`px-6 py-3 font-medium transition-colors ${
                view === 'parts'
                  ? 'text-brand-orange border-b-2 border-brand-orange bg-gray-50 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              type="button"
            >
              Parts
            </button>
            <button
              onClick={() => setView('models')}
              role="tab"
              aria-selected={view === 'models'}
              aria-controls="models-panel"
              id="models-tab"
              className={`px-6 py-3 font-medium transition-colors ${
                view === 'models'
                  ? 'text-brand-orange border-b-2 border-brand-orange bg-gray-50 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              type="button"
            >
              Models
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ARIA live region for status announcements */}
            <div 
              role="status" 
              aria-live="polite" 
              aria-atomic="true" 
              className="sr-only"
              id="compatibility-status"
            >
              {loading && 'Loading compatibility data, please wait.'}
              {saving && 'Saving compatibility changes, please wait.'}
              {error && `Error: ${error}`}
            </div>

            {view === 'parts' && (
              <div role="tabpanel" id="parts-panel" aria-labelledby="parts-tab">
                {error && (
                  <div 
                    className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-orange" aria-hidden="true" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
                    <span className="sr-only">Loading compatibility data, please wait.</span>
                  </div>
                ) : (
                  <>
                    {canEdit && (
                      <div className="mb-4">
                        <Button
                          onClick={handleAddSKU}
                          className="flex items-center gap-2"
                          aria-label="Add new compatible SKU"
                          type="button"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                          Add SKU
                        </Button>
                      </div>
                    )}

                    {isPaired && parentCompatibilities.length > 0 && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Parent Item</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {parentCompatibilities.map((comp, idx) => (
                            <li key={idx}>
                              {comp.skuBrand} {comp.skuValue}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                          These compatibles are managed under the parent item record.
                        </p>
                      </div>
                    )}

                    {compatibilities.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p>No compatible parts assigned</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse" role="table" aria-label="Compatible SKUs">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Brand</th>
                              <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">SKU</th>
                              {canEdit && (
                                <th scope="col" className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {compatibilities.map((comp) => (
                              <tr
                                key={comp.id}
                                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  {canEdit ? (
                                    <label htmlFor={`brand-${comp.id}`} className="sr-only">
                                      Brand name for compatibility record {comp.id}
                                    </label>
                                    <input
                                      type="text"
                                      id={`brand-${comp.id}`}
                                      value={comp.skuBrand}
                                      onChange={(e) => handleUpdateField(comp.id, 'skuBrand', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                                      placeholder="Brand name"
                                      maxLength={100}
                                      required
                                      aria-required="true"
                                      aria-describedby={error ? "compatibility-status" : undefined}
                                    />
                                  ) : (
                                    <span className="text-gray-900 dark:text-gray-100">{comp.skuBrand}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {canEdit ? (
                                    <label htmlFor={`sku-${comp.id}`} className="sr-only">
                                      SKU or part number for compatibility record {comp.id}
                                    </label>
                                    <input
                                      type="text"
                                      id={`sku-${comp.id}`}
                                      value={comp.skuValue}
                                      onChange={(e) => handleUpdateField(comp.id, 'skuValue', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                                      placeholder="SKU/Part number"
                                      maxLength={100}
                                      required
                                      aria-required="true"
                                      aria-describedby={error ? "compatibility-status" : undefined}
                                    />
                                  ) : (
                                    <span className="text-gray-900 dark:text-gray-100">{comp.skuValue}</span>
                                  )}
                                </td>
                                {canEdit && (
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => handleRemoveSKU(comp.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      aria-label={`Remove compatibility: ${comp.skuBrand} ${comp.skuValue}`}
                                      type="button"
                                    >
                                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {isPaired && compatibilities.length > 0 && (
                      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Note:</strong> This is a paired product. Compatible parts should be managed under the parent item.
                        </p>
                        <Button
                          onClick={handleMergeParts}
                          variant="secondary"
                          className="mt-3"
                          disabled={saving}
                          type="button"
                          aria-describedby="merge-parts-note"
                        >
                          Merge Parts to Parent
                        </Button>
                        <span id="merge-parts-note" className="sr-only">
                          Merges all compatible parts from this product to the parent product. This action cannot be undone.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {view === 'models' && (
              <div 
                role="tabpanel" 
                id="models-panel" 
                aria-labelledby="models-tab"
                className="text-center py-12 text-gray-500 dark:text-gray-400"
              >
                <p>Model compatibility will be integrated with the model lookup system.</p>
                <p className="text-sm mt-2">This feature is coming soon.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {canEdit && view === 'parts' && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={saving}
                type="button"
                aria-label="Cancel and close compatibility modal"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2"
                type="button"
                aria-label={saving ? "Saving compatibility changes" : "Save compatibility changes"}
                aria-describedby={error ? "compatibility-status" : undefined}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                    <span className="sr-only">Saving compatibility changes, please wait.</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

