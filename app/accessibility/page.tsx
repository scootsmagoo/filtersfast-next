import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Accessibility Statement | FiltersFast',
  description: 'FiltersFast is committed to ensuring digital accessibility for people with disabilities. Learn about our efforts and how to get help.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Website Accessibility Statement
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-brand-orange">
              <p className="text-lg font-semibold mb-2">Our Commitment</p>
              <p>
                Website accessibility is an ongoing effort and we are actively taking steps to further enhance and improve the accessibility of{' '}
                <a 
                  href="https://www.filtersfast.com" 
                  className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit www.filtersfast.com (opens in new tab)"
                >
                  www.filtersfast.com
                </a>
                . If you have difficulty using or accessing any element of this website, please contact us and we will work with you to provide the information, item, or transaction you seek through a communication method that is accessible for you, consistent with applicable law.
              </p>
            </div>

            <section className="mt-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Contact Us</h2>
              <p>
                If you experience any difficulty accessing our website, please don&apos;t hesitate to reach out:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="w-6 h-6 text-brand-orange" />
                    <h3 className="text-xl font-semibold">Call Us</h3>
                  </div>
                  <a 
                    href="tel:+18664383458" 
                    className="text-2xl text-brand-orange hover:text-brand-orange-dark font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    aria-label="Call 866-438-3458"
                  >
                    (866) 438-3458
                  </a>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Monday - Thursday: 9am-12:30pm ET | 1:30pm-5:30pm ET<br />
                    Friday: 9am-1:30pm ET
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-6 h-6 text-brand-orange" />
                    <h3 className="text-xl font-semibold">Email Us</h3>
                  </div>
                  <a 
                    href="mailto:sales@filtersfast.com" 
                    className="text-lg text-brand-orange hover:text-brand-orange-dark font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    aria-label="Email sales@filtersfast.com"
                  >
                    sales@filtersfast.com
                  </a>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Commitment to Diversity and Inclusion</h2>
              <p>
                At Filters Fast, accessibility, diversity and inclusion are important values that affect everything we do. Whether you use a screen reader, voice recognition software or another kind of assistive technology, we want{' '}
                <a 
                  href="https://www.filtersfast.com" 
                  className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit www.filtersfast.com (opens in new tab)"
                >
                  www.filtersfast.com
                </a>{' '}
                to be accessible to you and easy to navigate.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Accomplishing Accessibility Goals</h2>
              <p>
                We set our web accessibility standards high and are working to achieve them. Our team is dedicated to ensuring our site meets all laws and guidelines and creates a useable experience for all customers. We are continuously educating ourselves and learning through training sessions with advocacy groups, industry partners and more.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">How Our Site Has Changed and Is Changing</h2>
              <p>
                Here are some of the things we&apos;ve done and are continuing to do to make our site easy to use for everyone:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Improving Site Structure</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        We&apos;re working to edit the pages of www.filtersfast.com to include appropriate headings, lists, paragraphs and other formatting for better usability with assistive technology.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Keyboard Navigation</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Ensuring all interactive elements are accessible via keyboard for users who cannot use a mouse.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Screen Reader Support</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Implementing proper ARIA labels and semantic HTML to ensure compatibility with screen readers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Color Contrast</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Ensuring sufficient color contrast ratios for text and interactive elements to improve readability.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Alternative Text</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Providing descriptive alt text for all images to ensure content is accessible to screen reader users.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Form Accessibility</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Making forms more accessible with proper labels, instructions, and error messaging.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Standards and Guidelines</h2>
              <p>
                We are committed to conforming to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
              </p>
              <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Our Accessibility Partner</h3>
                <p className="mb-4">
                  We partner with accessibility experts to regularly audit our website and ensure ongoing compliance with accessibility standards.
                </p>
                <a 
                  href="https://www.levelaccess.com/a/filtersfast" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                  aria-label="View our accessibility profile on Level Access (opens in new tab)"
                >
                  View Our Accessibility Profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Feedback and Assistance</h2>
              <p>
                We welcome your feedback on the accessibility of our website. If you encounter any barriers or have suggestions for improvement, please let us know:
              </p>
              <div className="mt-6 p-6 bg-gradient-to-r from-brand-orange/10 to-brand-orange/5 dark:from-brand-orange/20 dark:to-brand-orange/10 rounded-lg border-l-4 border-brand-orange">
                <ul className="space-y-2">
                  <li>
                    <strong>Phone:</strong>{' '}
                    <a 
                      href="tel:+18664383458" 
                      className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                      aria-label="Call 866-438-3458"
                    >
                      (866) 438-3458
                    </a>
                  </li>
                  <li>
                    <strong>Email:</strong>{' '}
                    <a 
                      href="mailto:sales@filtersfast.com" 
                      className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                      aria-label="Email sales@filtersfast.com"
                    >
                      sales@filtersfast.com
                    </a>
                  </li>
                  <li>
                    <strong>Contact Form:</strong>{' '}
                    <Link 
                      href="/support" 
                      className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    >
                      Visit our Support Center
                    </Link>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Ongoing Commitment</h2>
              <p>
                Accessibility is an ongoing journey, not a destination. We are continuously working to improve the accessibility of our website and ensure that all customers can have a positive experience. We regularly:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Conduct accessibility audits of our website</li>
                <li>Train our team on accessibility best practices</li>
                <li>Update our content and features to meet accessibility standards</li>
                <li>Seek feedback from users with disabilities</li>
                <li>Partner with accessibility experts and advocacy groups</li>
                <li>Test our website with various assistive technologies</li>
              </ul>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-gray-600 dark:text-gray-400">
                This accessibility statement was last updated on{' '}
                <strong>August 11, 2021</strong>
              </p>
            </div>

          </div>
        </div>

        {/* Related Policies - Outside prose container to avoid prose link styles */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Related Policies</h3>
            <nav aria-label="Related policy pages">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/terms" 
                  className="flex-1 px-6 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
                  aria-label="View Terms & Conditions"
                >
                  Terms & Conditions
                </Link>
                <Link 
                  href="/privacy" 
                  className="flex-1 px-6 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
                  aria-label="View Privacy Policy"
                >
                  Privacy Policy
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

