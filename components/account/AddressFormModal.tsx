'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';
import type { SavedAddress, AddressFormData } from '@/lib/types/address';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  address?: SavedAddress | null;
}

export default function AddressFormModal({ isOpen, onClose, onSave, address }: AddressFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<AddressFormData>({
    label: '',
    name: '',
    address_line1: '',
    address_line2: null,
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: null,
    is_default: 0
  });

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label,
        name: address.name,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone,
        is_default: address.is_default
      });
    } else {
      setFormData({
        label: '',
        name: '',
        address_line1: '',
        address_line2: null,
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: null,
        is_default: 0
      });
    }
    setErrors({});
  }, [address, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, saving, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
      const url = address 
        ? `/api/account/addresses/${address.id}`
        : '/api/account/addresses';
      const method = address ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save address');
      }

      // Announce success to screen readers
      const successDiv = document.createElement('div');
      successDiv.setAttribute('role', 'status');
      successDiv.setAttribute('aria-live', 'polite');
      successDiv.className = 'sr-only';
      successDiv.textContent = address ? 'Address updated successfully' : 'Address added successfully';
      document.body.appendChild(successDiv);
      setTimeout(() => document.body.removeChild(successDiv), 1000);
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save address';
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

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus first input when modal opens
      const firstInput = document.getElementById('label');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      
      // Trap focus within modal
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return;
        
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
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
      
      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalId = `address-modal-${address?.id || 'new'}`;
  const headingId = `${modalId}-heading`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" 
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        id={modalId}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id={headingId} className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {address ? 'Edit Address' : 'Add New Address'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
              aria-label="Close dialog"
              disabled={saving}
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="label" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Label *
              </label>
              <input
                id="label"
                type="text"
                value={formData.label}
                onChange={(e) => {
                  setFormData({ ...formData, label: e.target.value });
                  if (errors.label) setErrors({ ...errors, label: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.label ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g., Home, Work, Office"
                maxLength={50}
                required
                aria-required="true"
                aria-invalid={!!errors.label}
                aria-describedby={errors.label ? 'label-error' : undefined}
              />
              {errors.label && (
                <p id="label-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                  {errors.label}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                required
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address_line1" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Address Line 1 *
              </label>
              <input
                id="address_line1"
                type="text"
                value={formData.address_line1}
                onChange={(e) => {
                  setFormData({ ...formData, address_line1: e.target.value });
                  if (errors.address_line1) setErrors({ ...errors, address_line1: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  errors.address_line1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                required
                aria-required="true"
                aria-invalid={!!errors.address_line1}
                aria-describedby={errors.address_line1 ? 'address_line1-error' : undefined}
              />
              {errors.address_line1 && (
                <p id="address_line1-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                  {errors.address_line1}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address_line2" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Address Line 2 (Optional)
              </label>
              <input
                id="address_line2"
                type="text"
                value={formData.address_line2 || ''}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                />
                {errors.city && (
                  <p id="city-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  State *
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({ ...formData, state: e.target.value });
                    if (errors.state) setErrors({ ...errors, state: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.state}
                  aria-describedby={errors.state ? 'state-error' : undefined}
                />
                {errors.state && (
                  <p id="state-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Postal Code *
                </label>
                <input
                  id="postal_code"
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => {
                    setFormData({ ...formData, postal_code: e.target.value });
                    if (errors.postal_code) setErrors({ ...errors, postal_code: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.postal_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.postal_code}
                  aria-describedby={errors.postal_code ? 'postal_code-error' : undefined}
                />
                {errors.postal_code && (
                  <p id="postal_code-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                    {errors.postal_code}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Country *
                </label>
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({ ...formData, country: e.target.value });
                    if (errors.country) setErrors({ ...errors, country: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.country}
                  aria-describedby={errors.country ? 'country-error' : undefined}
                />
                {errors.country && (
                  <p id="country-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                    {errors.country}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="is_default" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="is_default"
                  type="checkbox"
                  checked={formData.is_default === 1}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4"
                  aria-describedby="is_default-help"
                />
                <span id="is_default-help" className="text-sm text-gray-700 dark:text-gray-300">
                  Set as default address
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
                aria-label={saving ? 'Saving address' : (address ? 'Save address changes' : 'Add new address')}
              >
                {saving ? 'Saving...' : (address ? 'Save Changes' : 'Add Address')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={saving}
                aria-label="Cancel and close dialog"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

