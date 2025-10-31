'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, X, AlertCircle } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [items, setItems] = useState([
    { sku: '', description: '', quantity: 1, notes: '' }
  ]);
  const [customerMessage, setCustomerMessage] = useState('');

  const addItem = () => {
    setItems([...items, { sku: '', description: '', quantity: 1, notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate items
    const validItems = items.filter(item => item.description && item.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least one item with description and quantity');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/b2b/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems,
          customerMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit quote request');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/b2b');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Quote Request Submitted!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Our sales team will review your request and respond within 1 business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/b2b"
            className="text-brand-orange hover:underline mb-4 inline-block"
          >
            ← Back to B2B Portal
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Request a Quote
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Submit a quote request for bulk orders or special pricing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6" aria-label="Quote Request Form">
          {/* Items */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-brand-orange" />
              Items Requested
            </h2>

            {items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`sku-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU (Optional)
                    </label>
                    <input
                      type="text"
                      id={`sku-${index}`}
                      value={item.sku}
                      onChange={(e) => updateItem(index, 'sku', e.target.value)}
                      placeholder="e.g., 16x20x1-MERV8"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id={`quantity-${index}`}
                      min="1"
                      max="10000"
                      required
                      aria-required="true"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product Description *
                    </label>
                    <input
                      type="text"
                      id={`description-${index}`}
                      required
                      aria-required="true"
                      maxLength={500}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="e.g., 16x20x1 MERV 8 Air Filter - 12 Pack"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor={`notes-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      id={`notes-${index}`}
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Any special requirements..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center text-brand-orange hover:text-orange-600 font-medium"
              aria-label="Add another item to quote"
            >
              <Plus className="w-5 h-5 mr-1" aria-hidden="true" />
              Add Another Item
            </button>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="customerMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Message (Optional)
            </label>
            <textarea
              id="customerMessage"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Any additional information or special requests..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

            {error && (
              <div 
                role="alert"
                aria-live="assertive"
                className="flex items-start bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md"
              >
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
            </button>
            <Link
              href="/b2b"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

