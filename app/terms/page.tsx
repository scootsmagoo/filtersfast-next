import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | FiltersFast',
  description: 'FiltersFast Terms of Use - Please read these terms carefully before using our services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            FILTERS FAST TERMS OF USE
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Effective Date: August 11, 2021
            </p>

            <p>
              THESE FILTERS FAST TERMS OF USE, together with any documents they expressly incorporate by reference (these "Terms") are agreed to by and between Filters Fast LLC, a North Carolina limited liability company, having an address at 5905 Stockbridge Drive, Monroe, North Carolina 28110, United States ("Filters Fast," "we," "us," and "our") and you, or the entity on whose behalf you are agreeing to these Terms.
            </p>

            <p>
              These Terms govern your access to and use of the Filters Fast website located at{' '}
              <a 
                href="https://www.filtersfast.com" 
                className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.filtersfast.com
              </a>{' '}
              and all other websites, mobile sites, services, applications, platforms and tools where these Terms appear or are linked (collectively, the "Services"). You and other individuals or entities using the Services are collectively referred to as "Users." Any person or entity who interacts with the Services, whether through automated means, third-party means, or otherwise, is considered a User.
            </p>

            <p>
              These Terms include and incorporate by reference the Filters Fast Privacy Policy, Filters Fast Shipping Policy, and Filters Fast Returns and Refunds Policy, which are available for your review here:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                <Link href="/privacy" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                  Filters Fast Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#shipping-policy" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                  Filters Fast Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="#returns-refunds-policy" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                  Filters Fast Returns and Refunds Policy
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                  Filters Fast Accessibility Statement
                </Link>
              </li>
            </ul>

            <p>
              Unless you have entered into a separate written agreement with Filters Fast regarding the Services, these Terms are the complete and exclusive agreement between you and Filters Fast regarding your access to and use of the Services and supersede any oral or written proposal, quote, or other communication between you and Filters Fast regarding your access to and use of the Services.
            </p>

            <p className="font-bold">
              PLEASE READ THESE TERMS CAREFULLY. BY ACCESSING OR OTHERWISE USING THE SERVICES, YOU AGREE THAT YOU HAVE READ AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, OR DO NOT MEET THE QUALIFICATIONS INCLUDED IN THESE TERMS, FILTERS FAST IS NOT WILLING TO PROVIDE YOU WITH ACCESS TO OR USE OF THE SERVICES, AND YOU MUST NOT ACCESS OR USE THE SERVICES.
            </p>

            <p className="font-bold">
              SECTION 24 OF THIS AGREEMENT CONTAINS PROVISIONS THAT GOVERN HOW DISPUTES BETWEEN YOU AND US ARE RESOLVED. IN PARTICULAR, THE ARBITRATION AGREEMENT IN THAT SECTION WILL, WITH LIMITED EXCEPTIONS, REQUIRE DISPUTES BETWEEN YOU AND US TO BE SUBMITTED TO BINDING AND FINAL ARBITRATION, UNLESS YOU OPT OUT. IN ADDITION: (1) YOU WILL ONLY BE PERMITTED TO PURSUE CLAIMS AGAINST US ON AN INDIVIDUAL BASIS, AND NOT IN ANY CLASS OR REPRESENTATIVE PROCEEDING; AND (2) YOU ARE WAIVING YOUR RIGHT TO SEEK RELIEF IN A COURT OF LAW AND TO HAVE A JURY TRIAL ON YOUR CLAIMS. PLEASE SEE SECTION 24 FOR MORE INFORMATION REGARDING THIS ARBITRATION AGREEMENT, THE POSSIBLE EFFECTS OF THIS ARBITRATION AGREEMENT, AND HOW TO OPT OUT OF THE ARBITRATION AGREEMENT.
            </p>

            <ol className="list-decimal pl-6 space-y-6 mt-8">
              <li>
                <strong>DEFINITIONS.</strong> Words and phrases used in these Terms have the definitions given in these Terms or, if not defined herein, have their plain English meaning as commonly interpreted in the United States.
              </li>

              <li>
                <strong>TERM.</strong> These Terms are entered into as of the date you first access or use the Services (the "Effective Date") and will continue until terminated as set forth herein.
              </li>

              <li>
                <strong>MODIFICATIONS.</strong> We reserve the right, at any time, to modify any of the Services, as well as these Terms, whether by making those modifications available through the Services or by providing notice to you as specified in these Terms. Any modifications will be effective 24 hours following posting through the Services or delivery of such other notice. You may cease using the Services or terminate these Terms at any time if you do not agree to any modification. However, you will be deemed to have agreed to any and all modifications through your continued use of the Services following such notice. Any modifications to the Services, including all updates, upgrades, new versions, and new releases, will be treated as part of the "Services" for purposes of these Terms.
              </li>

              <li>
                <strong>ELIGIBILITY.</strong> You represent and warrant that you are an individual that is at least 18 years of age or older. You will not use the Services if you are less than 18 years of age.
              </li>

              <li>
                <strong>ACCESS.</strong> Subject to your agreement and compliance with these Terms, we will permit you to access and use the Services solely for lawful purposes and only in accordance with these Terms and any other written agreement you agree to before being given access to any specific Service. Any such additional agreement is in addition to these Terms; in the event of a conflict between these Terms and such additional agreement, such additional agreement controls.
              </li>

              <li>
                <strong>UNLAWFUL OR PROHIBITED USES OF THE SERVICES.</strong> The Services may only be used for lawful purposes in accordance with these Terms. As a condition of your use of the Services, you represent and warrant to us that you will not use the Services for any purpose that is unlawful or prohibited by these Terms. Whether on behalf of yourself or on behalf of any third party, you will not:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Make any commercial use of the Services other than in furtherance of any Transactions that you make through the Services;</li>
                  <li>Download, copy or transmit any content from the Services for the benefit of any third party;</li>
                  <li>Misrepresent your identity, impersonate any person or entity, falsely state or otherwise misrepresent your affiliation with any person or entity in connection with the Services, or express or imply that we endorse any statement that you make;</li>
                  <li>Conduct fraudulent activities through the Services;</li>
                  <li>Use the Services to defame, abuse, harass, stalk, threaten or otherwise violate the legal rights of others, including others&apos; privacy rights or rights of publicity; and</li>
                  <li>Harvest or collect personally identifiable data about Users.</li>
                </ul>
              </li>

              <li>
                <strong>ACCOUNTS.</strong> Before using certain Services, you may be required to establish an account (an "Account"). Approval of your request to establish an Account will be at our sole discretion. Each Account and the User identification and password for each Account (the "Account ID") is personal in nature. You may not distribute or transfer your Account or Account ID or provide a third party with the right to access your Account or Account ID. You are solely responsible for all use of the Services through your Account. You will ensure the security and confidentiality of your Account ID and will notify us immediately if any Account ID is lost, stolen or otherwise compromised. Any activities completed through your Account or under your Account ID will be deemed to have been done by you. You may not: (1) select or use an Account ID of another User with the intent to impersonate that User; and (2) use an Account ID that we, in our sole discretion, deem offensive. In addition to all other rights available to us, including those set forth in these Terms, we reserve the right to terminate your Account, refuse service to you, or cancel orders.
              </li>

              <li>
                <strong>OUR CONTENT.</strong>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>
                    <strong>Ownership and Responsibility.</strong> All content included with the Services that we provide such as text, graphics, logos, images, audio clips, video, data, music, software, application updates, and other materials (collectively "Our Content") is the owned or licensed property of Filters Fast or its suppliers or licensors and is protected by United States and international copyright, trademark, patent, or other proprietary rights (collectively, "IPR"). The collection, arrangement, and assembly of all Our Content through the Services are the exclusive property of Filters Fast and protected by United States and international copyright laws. Filters Fast and its suppliers and licensors expressly reserve all IPR in all Our Content. You are solely responsible for verifying the accuracy, completeness, and applicability of all Our Content and for your use of any of Our Content. Except as set forth in these Terms, you are granted no licenses or rights in or to any of Our Content, or any IPR therein or related thereto.
                  </li>
                  <li>
                    <strong>Viewing Our Content.</strong> Subject to your compliance with these Terms, you may view Our Content, solely as presented on the Services, in furtherance of any Transactions that you make through the Services and any other permitted uses of the Services. You will not directly or indirectly use any of Our Content for any other purpose. You will not, and will not permit any third party to: (a) alter, modify, copy, reproduce, publish, or create derivative works of any of Our Content; (b) distribute, sell, resell, lend, loan, lease, license, sublicense or transfer any of Our Content; or (c) alter, obscure or remove any copyright, trademark or any other notices that are provided on or in connection with any of Our Content.
                  </li>
                </ol>
              </li>

              <li>
                <strong>YOUR CONTENT.</strong>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>
                    <strong>Substance and Responsibility.</strong> We welcome your reviews, comments, and other communications, photos, videos, or any other content that you submit through or to the Services, or any content or information you publish through any social media and allow us to feature, such as your name, social media handle, accompanying text, and any images from your social media accounts (e.g., Twitter™, Instagram™, Pinterest™) (collectively, "Your Content"), as long as Your Content complies with these Terms. You are solely responsible for all Your Content that you provide through the Services.
                  </li>
                  <li>
                    <strong>License to Your Content.</strong> As between you and us, you retain ownership of Your Content. However, in addition to any other rights granted to us under these Terms, by providing Your Content through the Services, you grant us and our authorized representatives and contractors a non-exclusive, sub-licensable, fully paid-up, perpetual, irrevocable, royalty-free, transferable right and license to use, display, perform, transmit, copy, modify, delete, adapt, publish, translate, create derivative works from, sell and distribute Your Content and to incorporate Your Content into any form, medium, or technology, now known or hereafter developed, throughout the world, in each case in order to provide the Services and fulfill any other of our obligations under these Terms.
                  </li>
                </ol>
              </li>

              <li>
                <strong>TRANSACTIONS.</strong>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>
                    <strong>With Us.</strong> The Services provide you with the opportunity to buy products sold and shipped by us ("Products"). You will pay us any fees applicable to Products that you purchase.
                  </li>
                  <li>
                    <strong>Transaction Information.</strong> If you wish to purchase any Products available through the Services (each such purchase, a "Transaction"), you may be asked to supply certain information relevant to your Transaction including, without limitation, information about your method of payment (such as your payment card number and expiration date), your billing address, and your shipping information (collectively, "Transaction Information").
                  </li>
                  <li>
                    <strong>Products.</strong> All descriptions, images, references, features, content, specifications, Products and prices of Products are subject to change at any time without notice. The inclusion of any Products on the Services does not imply or warrant that these Products will be available. It is your responsibility to ascertain and obey all applicable local, state, federal, and international laws in regard to the receipt, possession, use, and sale of any Item.
                  </li>
                  <li>
                    <strong>Payment.</strong> You agree to pay us all Transaction charges that may be incurred by you or on your behalf through the Services, at the price(s) then in effect for the Products ordered, including without limitation all shipping and handling. In addition, you will remain responsible for any taxes that may be applicable to your Transactions. You will pay us all such Transaction charges by credit card upon the finalization of the applicable Transaction.
                  </li>
                </ol>
              </li>

              <li>
                <strong>COMMUNICATIONS.</strong> If you give us permission to contact you, we or our agents may call, text, or email you at the telephone number and/or email address that you provide us. You further agree that we may, for training purposes or to evaluate the quality of our customer service, listen to and record phone conversations you have with us or our agents regarding customer service issues.
              </li>

              <li>
                <strong>SMS SERVICES.</strong> By enrolling in, or otherwise requesting or agreeing to receive, text messages from or on behalf of Filters Fast (the "SMS Services"), you agree to the terms and conditions regarding SMS services including message frequency, delivery, and opt-out procedures. Message and data rates may apply.
              </li>
            </ol>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 id="shipping-policy" className="text-3xl font-bold mb-6">FILTERS FAST SHIPPING POLICY</h2>
              <p>
                Filters Fast offers economy free shipping every day on U.S. orders over $99 when shipping to the lower 48 states. This free shipping offer excludes Alaska and Hawaii, P.O. Box or APO/FPO/DPO and international orders. Orders under $99 ship for a fee to most destinations within the contiguous United States (excluding Hawaii and Alaska).
              </p>
              <p>
                Most Products ship within 1-2 business days after Transaction finalization, unless otherwise stated on the Product page on the Services. Your final shipping cost and estimated delivery time frame will be available to you during checkout.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 id="returns-refunds-policy" className="text-3xl font-bold mb-6">RETURNS AND REFUNDS POLICY</h2>
              <p>
                Filters Fast is happy to accept returns on items within 365 days of the original ship date. All returned Products are inspected and must be in a new, unused condition and contain all original parts, shrink wrap, protective seals, and components or, if used, must have been sold with the Satisfaction Guarantee Badge.
              </p>
              <p>
                Return requests must be processed using our self-service online portal. To access the online portal,{' '}
                <Link href="/account" className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline">
                  login to your FiltersFast account
                </Link>{' '}
                and use the returns section.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                For the complete and detailed Terms of Use, please contact us at{' '}
                <a 
                  href="mailto:support@filtersfast.com" 
                  className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                  aria-label="Email support at support@filtersfast.com"
                >
                  support@filtersfast.com
                </a>{' '}
                or call{' '}
                <a 
                  href="tel:+18664383458" 
                  className="text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 underline"
                  aria-label="Call us at 866-438-3458"
                >
                  (866) 438-3458
                </a>
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
                  href="/privacy" 
                  className="flex-1 px-6 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
                  aria-label="View Privacy Policy"
                >
                  Privacy Policy
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

