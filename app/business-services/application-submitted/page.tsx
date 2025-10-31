import Link from 'next/link';
import { CheckCircle, Home, Mail } from 'lucide-react';

export default function ApplicationSubmittedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Application Submitted Successfully!
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Thank you for your interest in becoming a FiltersFast B2B customer. 
            We've received your application and our team will review it shortly.
          </p>

          {/* What's Next */}
          <div className="bg-brand-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              What Happens Next?
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-white">Review:</strong> Our B2B team will review your application within 1-2 business days
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-white">Contact:</strong> A dedicated account manager will reach out to discuss your needs
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-white">Approval:</strong> Once approved, you'll receive portal access and wholesale pricing
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  4
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-white">Start Ordering:</strong> Begin placing orders with your custom pricing and terms
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-blue-900 dark:text-blue-300 mb-1">
                  <strong>Questions about your application?</strong>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Contact our B2B team at{' '}
                  <a
                    href="mailto:b2bsales@filtersfast.com"
                    className="font-medium hover:underline"
                  >
                    b2bsales@filtersfast.com
                  </a>
                  {' '}or call{' '}
                  <a
                    href="tel:1-866-438-3948"
                    className="font-medium hover:underline"
                  >
                    1-866-438-3948
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white font-semibold rounded-md transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Homepage
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-md transition-colors"
            >
              Go to My Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

