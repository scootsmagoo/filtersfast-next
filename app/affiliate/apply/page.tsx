'use client';

/**
 * Affiliate Application Page
 * 
 * Form for users to apply to become affiliates
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TrendingUp, AlertCircle } from 'lucide-react';

const PROMOTIONAL_METHODS = [
  { value: 'blog', label: 'Blog/Website' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'paid_ads', label: 'Paid Advertising' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'influencer', label: 'Influencer Marketing' },
  { value: 'other', label: 'Other' }
];

const AUDIENCE_SIZES = [
  { value: 'less_1k', label: 'Less than 1,000' },
  { value: '1k_10k', label: '1,000 - 10,000' },
  { value: '10k_100k', label: '10,000 - 100,000' },
  { value: '100k_plus', label: '100,000+' }
];

export default function AffiliateApplicationPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    promotional_methods: [] as string[],
    audience_size: '',
    promotion_plan: '',
    social_media_links: [''],
    monthly_traffic: '',
    paypal_email: '',
    preferred_payout_method: 'paypal' as 'paypal' | 'bank_transfer' | 'check',
    agree_to_terms: false
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/affiliate/apply');
    }
  }, [session, isPending, router]);

  const handleMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      promotional_methods: prev.promotional_methods.includes(method)
        ? prev.promotional_methods.filter(m => m !== method)
        : [...prev.promotional_methods, method]
    }));
  };

  const handleSocialLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.social_media_links];
    newLinks[index] = value;
    setFormData(prev => ({ ...prev, social_media_links: newLinks }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_media_links: [...prev.social_media_links, '']
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_media_links: prev.social_media_links.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filter out empty social links
      const socialLinks = formData.social_media_links.filter(link => link.trim() !== '');

      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          social_media_links: socialLinks.length > 0 ? socialLinks : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      router.push('/affiliate?success=application_submitted');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Affiliate Application</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Join our affiliate program and start earning commissions
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <div 
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company/Brand Name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium mb-2">
                Company/Brand Name (Optional)
              </label>
              <input
                id="company_name"
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
                placeholder="Your company or brand name"
                aria-describedby="company_name-help"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-2">
                Website URL <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
                placeholder="https://example.com"
                required
                aria-required="true"
              />
            </div>

            {/* Promotional Methods */}
            <fieldset>
              <legend className="block text-sm font-medium mb-2">
                How will you promote our products? <span className="text-red-500" aria-label="required">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Promotional methods">
                {PROMOTIONAL_METHODS.map(method => (
                  <label
                    key={method.value}
                    className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.promotional_methods.includes(method.value)}
                      onChange={() => handleMethodToggle(method.value)}
                      className="rounded text-brand-orange focus:ring-brand-orange"
                      aria-label={method.label}
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Audience Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Estimated Audience Size
              </label>
              <select
                value={formData.audience_size}
                onChange={(e) => setFormData(prev => ({ ...prev, audience_size: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
              >
                <option value="">Select audience size</option>
                {AUDIENCE_SIZES.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>

            {/* Monthly Traffic */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Estimated Monthly Traffic/Views
              </label>
              <input
                type="text"
                value={formData.monthly_traffic}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_traffic: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
                placeholder="e.g., 50,000 monthly visitors"
              />
            </div>

            {/* Social Media Links */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Social Media Profiles (Optional)
              </label>
              {formData.social_media_links.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
                    placeholder="https://twitter.com/yourhandle"
                  />
                  {formData.social_media_links.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeSocialLink(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialLink}
                className="mt-2"
              >
                + Add Another Link
              </Button>
            </div>

            {/* Promotion Plan */}
            <div>
              <label htmlFor="promotion_plan" className="block text-sm font-medium mb-2">
                How do you plan to promote our products? <span className="text-red-500" aria-label="required">*</span>
              </label>
              <textarea
                id="promotion_plan"
                value={formData.promotion_plan}
                onChange={(e) => setFormData(prev => ({ ...prev, promotion_plan: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800 h-32"
                placeholder="Tell us about your promotional strategy, target audience, content plans, etc. (minimum 50 characters)"
                required
                minLength={50}
                aria-required="true"
                aria-describedby="promotion_plan-help"
              />
              <p id="promotion_plan-help" className="text-xs text-gray-500 mt-1" aria-live="polite">
                {formData.promotion_plan.length} / 50 minimum characters
              </p>
            </div>

            {/* Payment Info */}
            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Preferred Payout Method
                </label>
                <select
                  value={formData.preferred_payout_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_payout_method: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
                >
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>

              {formData.preferred_payout_method === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    value={formData.paypal_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, paypal_email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-800"
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can add this later in your settings if you prefer
                  </p>
                </div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="border-t dark:border-gray-700 pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="agree_to_terms"
                  type="checkbox"
                  checked={formData.agree_to_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agree_to_terms: e.target.checked }))}
                  className="mt-1 rounded text-brand-orange focus:ring-brand-orange"
                  required
                  aria-required="true"
                  aria-describedby="terms-text"
                />
                <span id="terms-text" className="text-sm">
                  I agree to the affiliate program terms and conditions. I understand that my application
                  will be reviewed and I will be notified of the decision via email. <span className="text-red-500" aria-label="required">*</span>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.promotional_methods.length === 0 || !formData.agree_to_terms}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

