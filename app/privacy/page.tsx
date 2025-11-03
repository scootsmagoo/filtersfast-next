import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | FiltersFast',
  description: 'FiltersFast Privacy Policy - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Privacy Policy
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Effective Date: August 11, 2021 | Last Updated: August 11, 2021
            </p>

            <p>
              This Privacy Policy describes how Filters Fast and affiliates (collectively, "Filters Fast," "we," "us," or "our") collects, uses, shares, and safeguards personal information. This Privacy Policy also tells you about your rights and choices with respect to your personal information, and how you can reach us to get answers to your questions. This Privacy Policy also applies to AcePools.com.
            </p>

            <nav className="my-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg" aria-label="Privacy policy sections">
              <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li>
                  <a href="#types-of-info" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Types Of Information We Collect
                  </a>
                </li>
                <li>
                  <a href="#use-and-processing" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Use And Processing Of Information
                  </a>
                </li>
                <li>
                  <a href="#sharing-of-info" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Sharing Of Information
                  </a>
                </li>
                <li>
                  <a href="#your-choices" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Your Choices
                  </a>
                </li>
                <li>
                  <a href="#authorized-agent" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Authorized Agent
                  </a>
                </li>
                <li>
                  <a href="#how-we-protect" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    How We Protect Personal Information
                  </a>
                </li>
                <li>
                  <a href="#other-important-info" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Other Important Information
                  </a>
                </li>
                <li>
                  <a href="#contact-info" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                    Contact Information
                  </a>
                </li>
              </ul>
            </nav>

            <section id="types-of-info" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Types Of Information We Collect</h2>
              <p>
                The following provides examples of the type of information that we collect from you and how we use that information.
              </p>

              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Context</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Types of Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Account Registration</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We collect your name and contact information when you create an account.</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We have a legitimate interest in providing account related functionalities to our users.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Cookies</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We use cookies and similar tracking technologies.</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We have a legitimate interest in making our website operate efficiently.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Order Placement</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We collect your name, billing address, shipping address, e-mail address, phone number, and payment information.</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We use your information to perform our contract to provide you with products or services.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Email Communications</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We capture data related to when you open our messages and click on links.</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We have a legitimate interest in understanding how you interact with our communications.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Website Interactions</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We monitor how you interact with our website, including which links you click on.</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We have a legitimate interest in understanding how you interact with our website to better improve it.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-6">
                In addition to the information that we collect from you directly, we may also receive information about you from other sources, including third parties, business partners, our affiliates, or publicly available sources.
              </p>
            </section>

            <section id="use-and-processing" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Use And Processing Of Information</h2>
              <p>In addition to the purposes and uses described above, we use information in the following ways:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>To identify you when you visit our websites.</li>
                <li>To provide products and services or to process returns.</li>
                <li>To improve our services and product offerings.</li>
                <li>To streamline the checkout process.</li>
                <li>To conduct analytics.</li>
                <li>To respond to inquiries related to support, employment opportunities, or other requests.</li>
                <li>To send marketing and promotional materials including information relating to our products, services, sales, or promotions.</li>
                <li>For internal administrative purposes, as well as to manage our relationships.</li>
              </ul>
            </section>

            <section id="sharing-of-info" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Sharing Of Information</h2>
              <p>In addition to the specific situations discussed elsewhere in this policy, we disclose information in the following situations:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong>Affiliates and Acquisitions.</strong> We may share information with our corporate affiliates (e.g., parent company, sister companies, subsidiaries, joint ventures, or other companies under common control).
                </li>
                <li>
                  <strong>Service Providers.</strong> We may share your information with service providers. Among other things service providers may help us to administer our website, conduct surveys, provide technical support, process payments, and assist in the fulfillment of orders.
                </li>
                <li>
                  <strong>Legal Compliance.</strong> We may disclose information in response to subpoenas, warrants, or court orders, or in connection with any legal process, or to comply with relevant laws.
                </li>
                <li>
                  <strong>SMS Services.</strong> We will not share your opt-in to an SMS campaign with any third party for purposes unrelated to providing you with the services of that campaign. We may share your Personal Data, including your SMS opt-in or consent status, with third parties that help us provide our messaging services.
                </li>
              </ul>
            </section>

            <section id="your-choices" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Your Choices</h2>
              <p>You can make the following choices regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong>Access To Your Personal Information.</strong> If required by law, upon request, we will grant you reasonable access to the personal information that we have about you.
                </li>
                <li>
                  <strong>Changes To Your Personal Information.</strong> We rely on you to update and correct your personal information. Most of our websites allow you to modify or delete your account profile.
                </li>
                <li>
                  <strong>Deletion Of Your Personal Information.</strong> You may request that we delete your personal information by contacting us at the address described below.
                </li>
                <li>
                  <strong>Promotional Emails.</strong> You may choose to provide us with your email address for the purpose of allowing us to send free newsletters, surveys, offers, and other promotional materials to you. You can stop receiving promotional emails by following the unsubscribe instructions in e-mails that you receive.
                </li>
                <li>
                  <strong>Promotional Text Messages.</strong> If you receive a text message from us that contains promotional information you can opt-out of receiving future text messages by replying "STOP."
                </li>
              </ul>

              <div className="mt-6 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p>
                  Please address written requests and questions about your rights to{' '}
                  <a 
                    href="mailto:privacy@filtersfast.com" 
                    className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    aria-label="Email privacy concerns to privacy@filtersfast.com"
                  >
                    privacy@filtersfast.com
                  </a>{' '}
                  or call us at{' '}
                  <a 
                    href="tel:+18664383458" 
                    className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    aria-label="Call us at 866-438-3458"
                  >
                    (866) 438-3458
                  </a>
                  .
                </p>
              </div>
            </section>

            <section id="authorized-agent" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Authorized Agent</h2>
              <p>
                In some circumstances, you may designate an authorized agent to submit requests to exercise certain privacy rights on your behalf. We will require verification that you provided the authorized agent permission to make a request on your behalf.
              </p>
            </section>

            <section id="how-we-protect" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">How We Protect Personal Information</h2>
              <p>
                No method of transmission over the Internet, or method of electronic storage, is fully secure. While we use reasonable efforts to protect your personal information from unauthorized access, use, or disclosure, we cannot guarantee the security of your personal information. In the event that we are required by law to inform you of a breach to your personal information we may notify you electronically, in writing, or by telephone, if permitted to do so by law.
              </p>
              <p>
                Some of our websites permit you to create an account. When you do you will be prompted to create a password. You are responsible for maintaining the confidentiality of your password, and you are responsible for any access to or use of your account by someone else that has obtained your password, whether or not such access or use has been authorized by you.
              </p>
            </section>

            <section id="other-important-info" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Other Important Information</h2>
              <p>The following additional information relates to our privacy practices:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong>Third Party Applications/Websites.</strong> We have no control over the privacy practices of websites or applications that we do not own.
                </li>
                <li>
                  <strong>Changes To This Privacy Policy.</strong> We may change our privacy policy and practices over time. To the extent that our policy changes in a material way, the policy that was in place at the time that you submitted personal information to us will generally govern that information unless we receive your consent to the new privacy policy.
                </li>
                <li>
                  <strong>Children.</strong> We do not knowingly sell the personal information of minors under 16 years of age.
                </li>
                <li>
                  <strong>Information for California Residents.</strong> California law indicates that organizations should disclose whether certain categories of information are collected, "sold" or transferred for an organization's "business purpose." We do not discriminate against California residents who exercise any of their rights described in this Privacy Policy.
                </li>
              </ul>
            </section>

            <section id="cookie-policy" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Cookie Policy</h2>
              <p>
                This Cookie Policy describes how and when we use different types of cookies when you visit our Sites, whether accessed through a computer, tablet, smartphone or other device, and our mobile applications.
              </p>

              <h3 className="text-2xl font-bold mb-4 mt-8">What are Cookies?</h3>
              <p>
                A cookie is a small text file that is sent to your internet browser from the websites you visit and stored on your computer&apos;s hard drive or tablet or mobile device. In a similar way to many other websites, we use cookies to help us tailor our services to your needs so we can deliver a better and more personalized service.
              </p>

              <h3 className="text-2xl font-bold mb-4 mt-8">What Types of Cookies do We Use?</h3>
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cookie Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Essential Cookies</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">These are cookies that our Site needs in order to function, and that enable you to move around and use its services and features.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Analytics Cookies</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">Analytics cookies collect information about your use of the website that allow us to study, and then improve, how customers interact with the website.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Advertising Cookies</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">We may use third-party advertising companies to serve ads when you visit our Sites. These companies may employ cookies to measure advertising effectiveness.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Cart Tracking</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">The Filters Fast website uses cookies to help keep track of items added to your shopping cart including when you have abandoned your cart.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-2xl font-bold mb-4 mt-8">How Can I Manage My Cookies?</h3>
              <p>If you wish to manage or opt-out of cookies utilized by our Sites and third party advertisers, you can take the following steps:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>You may be able to download an opt-out cookie from the third party advertiser&apos;s website allowing you to opt-out of cookies.</li>
                <li>Your web browser may allow you to manage what cookies are accepted or declined. These settings can usually be found in the preferences or options menus of your web browser.</li>
                <li>Your web browser may also allow you to manually view cookies and delete the cookies you don&apos;t want or need.</li>
              </ul>
              <p className="mt-4">
                For more information about opting out of interest based advertising, you can visit:{' '}
                <a 
                  href="https://www.networkadvertising.org/choices/" 
                  className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Visit Network Advertising Initiative choices page (opens in new tab)"
                >
                  https://www.networkadvertising.org/choices/
                </a>
              </p>
            </section>

            <section id="contact-info" className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6 mt-12">Contact Information</h2>
              <p>
                If you have any questions, comments, or complaints concerning our privacy practices please contact us at the appropriate address below. We will attempt to respond to your requests and to provide you with additional privacy-related information.
              </p>
              <div className="mt-6 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <p className="mb-2">
                  <a 
                    href="mailto:privacy@filtersfast.com" 
                    className="text-brand-orange hover:text-brand-orange-dark text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    aria-label="Email privacy@filtersfast.com"
                  >
                    privacy@filtersfast.com
                  </a>
                </p>
                <p className="mb-2">
                  <a 
                    href="tel:+18664383458" 
                    className="text-brand-orange hover:text-brand-orange-dark text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                    aria-label="Call 866-438-3458"
                  >
                    (866) 438-3458
                  </a>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monday - Friday 9am-12:30pm EST | 1:30pm-5:30pm EST
                </p>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                If you are not satisfied with our response, and are in the European Union, you may have a right to lodge a complaint with your local supervisory authority.
              </p>
            </section>

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
                  href="/accessibility" 
                  className="flex-1 px-6 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
                  aria-label="View Accessibility Statement"
                >
                  Accessibility Statement
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

