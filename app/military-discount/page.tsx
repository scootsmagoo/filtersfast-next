/**
 * Military & First Responder Discount Landing Page
 * 
 * Explains the ID.me discount program and benefits
 * WCAG 2.1 AA compliant
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, CheckCircle, Users } from 'lucide-react';
import IdMeVerificationButton from '@/components/idme/IdMeVerificationButton';

export const metadata: Metadata = {
  title: 'Military & First Responder Discounts | FiltersFast',
  description: 'Thank you for your service. FiltersFast offers exclusive discounts to military members, veterans, and first responders verified through ID.me.',
};

export default function MilitaryDiscountPage() {
  return (
    <div className="bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Thank You For Your Service
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              FiltersFast is proud to offer exclusive discounts to military members, veterans, and first responders
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Shield className="w-6 h-6" aria-hidden="true" />
              <span className="text-lg font-semibold">10% Off All Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Program Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
              Program Benefits
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 transition-colors">
              You sacrifice so much to protect us every single day. FiltersFast wants to help make it easy and affordable for you to protect your home and your family by offering the best in home filtration.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">10% Discount</h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors">On all products with no exclusions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Easy Verification</h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors">Quick verification through ID.me</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">No Exclusions</h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors">Discount applies to your entire order</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Always Available</h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors">Once verified, your discount is always active</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Secure Verification
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                FiltersFast partners with ID.me to verify discount eligibility in real time, so you can sign up quickly and start saving.
              </p>
            </div>
            <IdMeVerificationButton />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 dark:bg-gray-800 py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12 transition-colors">
            Get Your Discount in 3 Easy Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm text-center transition-colors">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors">
                Shop FiltersFast
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Browse our products and add items to your cart
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm text-center transition-colors">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors">
                Verify with ID.me
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Click "Verify with ID.me" in your cart and complete the quick verification
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm text-center transition-colors">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors">
                Enjoy Your Savings
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Your 10% discount will automatically apply to your order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Who Qualifies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12 transition-colors">
            Who Qualifies?
          </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Active Military
            </h3>
            <p className="text-gray-600">
              Active duty members of all branches of the U.S. Armed Forces
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Veterans
            </h3>
            <p className="text-gray-600">
              Honorably discharged veterans of the U.S. Armed Forces
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              National Guard & Reserves
            </h3>
            <p className="text-gray-600">
              Members of the National Guard and Reserves
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Firefighters
            </h3>
            <p className="text-gray-600">
              Professional and volunteer firefighters
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Police & Law Enforcement
            </h3>
            <p className="text-gray-600">
              Police officers and law enforcement officials
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              EMT & Paramedics
            </h3>
            <p className="text-gray-600">
              Emergency medical technicians and paramedics
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-gray-50 dark:bg-gray-800 py-16 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12 transition-colors">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6" role="list" aria-label="Frequently asked questions about military and first responder discount">
            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors" role="listitem">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors">
                What is ID.me?
              </summary>
              <p className="px-6 pb-4 text-gray-700 dark:text-gray-300 transition-colors">
                ID.me is a secure digital identity verification platform used by hundreds of leading organizations, including the VA and Social Security Administration. They verify your military or first responder status securely without sharing your personal information with merchants.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors" role="listitem">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors">
                How do I access my discount?
              </summary>
              <p className="px-6 pb-4 text-gray-700 dark:text-gray-300 transition-colors">
                Add items to your cart and click the "Verify with ID.me" button. Log into your ID.me account (or create one if you don't have one). Once verified, your discount will automatically apply to qualifying products in your cart.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors" role="listitem">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors">
                Is my personal data protected?
              </summary>
              <p className="px-6 pb-4 text-gray-700 dark:text-gray-300 transition-colors">
                Yes. Your privacy is important to FiltersFast and ID.me. The ID.me platform promises not to share your information, and you may delete your account at any time. Privacy is built into the ID.me platform, and your data is not shared or sold to anyone.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors" role="listitem">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors">
                Can I combine this with other discounts?
              </summary>
              <p className="px-6 pb-4 text-gray-700 dark:text-gray-300 transition-colors">
                The military/first responder discount cannot be combined with other promotional codes. If you have a promo code, the higher discount will automatically be applied to your order.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors" role="listitem">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors">
                What if I have issues with my ID.me account?
              </summary>
              <p className="px-6 pb-4 text-gray-700 dark:text-gray-300 transition-colors">
                Please contact the ID.me support team if you have questions about your eligibility or difficulty accessing your account. They're available 8 AM through midnight EST, 7 days a week at <a href="tel:866-775-4363" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors">866-775-4363</a>.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Verify your status today and enjoy 10% off all products
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cart"
              className="inline-block bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
              aria-label="View your shopping cart"
            >
              Go to Cart
            </Link>
            <Link
              href="/air-filters"
              className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white focus:outline-none focus:ring-4 focus:ring-white/50"
              aria-label="Shop air filters and browse products"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

