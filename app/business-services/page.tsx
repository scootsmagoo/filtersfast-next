'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, TrendingUp, Shield, CheckCircle, Mail, Phone, MapPin, FileText, Package } from 'lucide-react';

export default function BusinessServicesPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    businessType: 'reseller' as const,
    taxId: '',
    businessLicense: '',
    yearsInBusiness: '',
    annualRevenue: '',
    numberOfEmployees: '',
    website: '',

    // Contact Information
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',

    // Billing Address
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'US',

    // Shipping Address
    shippingDifferent: false,
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'US',

    // Business Details
    resaleCertificate: '',
    currentSuppliers: '',
    estimatedMonthlyVolume: '',
    reasonForApplying: '',

    // Terms
    agreeToTerms: false,
    agreeToCredit: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/b2b/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      // Redirect to success page
      router.push('/business-services/application-submitted');
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      
      // WCAG: Announce error to screen readers
      const errorElement = document.getElementById('form-error');
      if (errorElement) {
        errorElement.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-orange to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Business Services | B2B Filtration Solutions
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Join thousands of businesses who trust FiltersFast for their filtration needs. 
              Access wholesale pricing, custom solutions, and dedicated account management.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ordering for Your Business Made Simple
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              FiltersFast.com has many long-standing relationships with top air and water filtration 
              manufacturers that allow us to offer unmatched solutions to help grow your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-brand-orange dark:text-orange-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Volume Discounts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Reduce costs by taking advantage of our quantity discounts
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
                <Shield className="w-8 h-8 text-brand-orange dark:text-orange-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tailored Solutions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Custom solutions unique to your business needs
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
                <Users className="w-8 h-8 text-brand-orange dark:text-orange-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Dedicated Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Experience exceptional, one-on-one customer service
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
                <Package className="w-8 h-8 text-brand-orange dark:text-orange-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Major Brands
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Gain access to product catalogs from top filtration brands
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Apply for a B2B Account
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Complete the form below to learn more and get access to our wholesale portal!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8" aria-label="B2B Account Application Form">
            {/* Company Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-brand-orange" />
                Company Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    maxLength={200}
                    aria-required="true"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    aria-required="true"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="reseller">Reseller</option>
                    <option value="distributor">Distributor</option>
                    <option value="corporate">Corporate</option>
                    <option value="government">Government</option>
                    <option value="nonprofit">Non-Profit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    placeholder="XX-XXXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    name="yearsInBusiness"
                    min="0"
                    value={formData.yearsInBusiness}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Revenue
                  </label>
                  <select
                    name="annualRevenue"
                    value={formData.annualRevenue}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="under-100k">Under $100,000</option>
                    <option value="100k-500k">$100,000 - $500,000</option>
                    <option value="500k-1m">$500,000 - $1,000,000</option>
                    <option value="1m-5m">$1,000,000 - $5,000,000</option>
                    <option value="over-5m">Over $5,000,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Employees
                  </label>
                  <select
                    name="numberOfEmployees"
                    value={formData.numberOfEmployees}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="over-500">Over 500</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-brand-orange" />
                Contact Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    required
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="contactTitle"
                    value={formData.contactTitle}
                    onChange={handleChange}
                    placeholder="e.g., Purchasing Manager"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-brand-orange" />
                Billing Address
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="billingStreet"
                    required
                    value={formData.billingStreet}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="billingCity"
                    required
                    value={formData.billingCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="billingState"
                    required
                    value={formData.billingState}
                    onChange={handleChange}
                    placeholder="NC"
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="billingZip"
                    required
                    value={formData.billingZip}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country *
                  </label>
                  <select
                    name="billingCountry"
                    required
                    value={formData.billingCountry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-brand-orange" />
                Business Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Monthly Order Volume
                  </label>
                  <select
                    name="estimatedMonthlyVolume"
                    value={formData.estimatedMonthlyVolume}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="under-1k">Under $1,000</option>
                    <option value="1k-5k">$1,000 - $5,000</option>
                    <option value="5k-10k">$5,000 - $10,000</option>
                    <option value="10k-25k">$10,000 - $25,000</option>
                    <option value="over-25k">Over $25,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Filter Suppliers (Optional)
                  </label>
                  <textarea
                    name="currentSuppliers"
                    value={formData.currentSuppliers}
                    onChange={handleChange}
                    rows={2}
                    placeholder="List your current suppliers..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Why are you applying for a B2B account? *
                  </label>
                  <textarea
                    name="reasonForApplying"
                    required
                    value={formData.reasonForApplying}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your business needs and how we can help..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  required
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <Link href="/terms" className="text-brand-orange hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand-orange hover:underline">
                    Privacy Policy
                  </Link>
                  *
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToCredit"
                  checked={formData.agreeToCredit}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I authorize FiltersFast to perform a credit check for net payment terms consideration
                </span>
              </label>
            </div>

            {error && (
              <div 
                id="form-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Questions? Email us at{' '}
              <a href="mailto:b2bsales@filtersfast.com" className="text-brand-orange hover:underline">
                b2bsales@filtersfast.com
              </a>
              {' '}or call{' '}
              <a href="tel:1-866-438-3948" className="text-brand-orange hover:underline">
                1-866-438-3948
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Our team of dedicated in-house business experts are available to work with you one-on-one
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
              <Mail className="w-6 h-6 text-brand-orange dark:text-orange-400" aria-hidden="true" />
            </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
              <a
                href="mailto:b2bsales@filtersfast.com"
                className="text-brand-orange hover:underline"
              >
                b2bsales@filtersfast.com
              </a>
            </div>

            <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
              <Phone className="w-6 h-6 text-brand-orange dark:text-orange-400" aria-hidden="true" />
            </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
              <a
                href="tel:1-866-438-3948"
                className="text-brand-orange hover:underline"
              >
                1-866-438-3948
              </a>
            </div>

            <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
              <MapPin className="w-6 h-6 text-brand-orange dark:text-orange-400" aria-hidden="true" />
            </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Charlotte, NC<br />
                United States
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

