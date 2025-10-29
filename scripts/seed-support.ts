/**
 * Seed Support Portal with categories and articles
 * Run with: npx tsx scripts/seed-support.ts
 */

import Database from 'better-sqlite3';
import { initializeSupportTables, createCategory, createArticle } from '../lib/db/support';

const db = new Database('auth.db');

console.log('🌱 Seeding Support Portal...\n');

try {
  // Initialize tables
  initializeSupportTables();
  console.log('✅ Support tables initialized');

  // Create categories
  const categories = [
    {
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'New to FiltersFast? Start here to learn the basics.',
      icon: '🚀',
      sort_order: 1,
    },
    {
      name: 'Orders & Shipping',
      slug: 'orders-shipping',
      description: 'Track orders, shipping information, and delivery times.',
      icon: '📦',
      sort_order: 2,
    },
    {
      name: 'Returns & Exchanges',
      slug: 'returns-exchanges',
      description: 'Our 365-day return policy and exchange process.',
      icon: '🔄',
      sort_order: 3,
    },
    {
      name: 'Products & Filters',
      slug: 'products-filters',
      description: 'Learn about our filters, sizes, and compatibility.',
      icon: '🔍',
      sort_order: 4,
    },
    {
      name: 'Account & Settings',
      slug: 'account-settings',
      description: 'Manage your account, password, and preferences.',
      icon: '👤',
      sort_order: 5,
    },
    {
      name: 'Subscribe & Save',
      slug: 'subscribe-save',
      description: 'Automatic deliveries with 5% discount on every order.',
      icon: '💰',
      sort_order: 6,
    },
    {
      name: 'Payment & Billing',
      slug: 'payment-billing',
      description: 'Payment methods, invoices, and billing questions.',
      icon: '💳',
      sort_order: 7,
    },
  ];

  const categoryIds: Record<string, number> = {};
  categories.forEach(cat => {
    const id = createCategory(cat);
    categoryIds[cat.slug] = id;
    console.log(`✅ Created category: ${cat.name}`);
  });

  // Create comprehensive articles from FiltersFast legacy content
  const articles = [
    // ========== GETTING STARTED ==========
    {
      category_id: categoryIds['getting-started'],
      title: 'How do I create an account?',
      slug: 'how-to-create-account',
      excerpt: 'Learn how to sign up for a FiltersFast account in just a few steps.',
      content: `
        <h2>Creating Your FiltersFast Account</h2>
        <p>Setting up an account with FiltersFast is quick and easy. Here's how:</p>
        
        <h3>Step 1: Go to Sign Up</h3>
        <p>Click the "Sign In" button in the top right corner, then click "Sign Up" at the bottom of the modal.</p>
        
        <h3>Step 2: Enter Your Information</h3>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Strong password (at least 8 characters with uppercase, lowercase, and numbers)</li>
        </ul>
        
        <h3>Step 3: Verify Your Email</h3>
        <p>Check your email for a verification link. Click it to activate your account.</p>
        
        <h3>Benefits of Having an Account</h3>
        <ul>
          <li>Track your orders in real-time</li>
          <li>Save your favorite filters</li>
          <li>Set up auto-delivery subscriptions</li>
          <li>View order history</li>
          <li>Quick reorder with one click</li>
        </ul>
        
        <p><strong>Need help?</strong> Contact our support team at support@filtersfast.com</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['getting-started'],
      title: 'What is the FiltersFast story?',
      slug: 'our-story',
      excerpt: 'Learn about how FiltersFast became the top filtration provider online.',
      content: `
        <h2>The FiltersFast Story</h2>
        <p>In 2003, Ray Scardigno became frustrated trying to purchase his refrigerator filter online...</p>
        
        <blockquote>
          <p>"There were only a handful of small sites selling filters online. My refrigerator filter seemed like a common type and I didn't want to pay the mark up of the big box stores but I simply could not figure out how to buy filters online. I saw an opportunity to create a shopping experience where customers could find the filter they need fast and deliver their product for a great price!"</p>
          <footer>— Ray Scardigno, Founder/CEO FiltersFast</footer>
        </blockquote>
        
        <h3>Growth & Evolution</h3>
        <p>Since 2004, FiltersFast has grown to become the top filtration provider online in the United States and continues to grow rapidly. Though we have expanded to sell filters all over the world, FiltersFast still remains a family-owned business located in Charlotte, NC.</p>
        
        <h3>Our Mission</h3>
        <p>FiltersFast's mission is to provide our customers with the best filtration shopping experience - a comprehensive catalog that is easy to navigate, the tools and education to make the right choice, and the best customer experience and support to help along the way. Each member of our team knows that everything they do is important and can change lives! This mindset is what drives us to the highest levels of performance and innovation. Our focus is filtration, but our mission is so much more than that.</p>
        
        <h3>Awards & Recognition</h3>
        <ul>
          <li>Top Work Places 2018-2024</li>
          <li>BBB A+ Rating</li>
          <li>Water Quality Association Member</li>
          <li>National Air Filtration Association Member</li>
          <li>Family Business Award</li>
        </ul>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 2,
    },
    {
      category_id: categoryIds['getting-started'],
      title: 'What is your company mission?',
      slug: 'our-mission',
      excerpt: 'Discover FiltersFast\'s mission and core values.',
      content: `
        <h2>Our Mission</h2>
        <p>"To provide our customers with the best filtration shopping experience - a comprehensive catalog that is easy to navigate, the tools and education to make the right choice, and the best customer experience and support to help along the way."</p>
        
        <h3>Our Core Values</h3>
        
        <h4>Purpose</h4>
        <p>We pursue opportunities and challenges with passion and initiative; taking ownership to proactively drive toward our vision.</p>
        
        <h4>Loyalty</h4>
        <p>We value mutual loyalty with our team and with our customers. We are creative problem solvers and use our skills and learning to recommend quality products to fit customers' unique filtration needs.</p>
        
        <h4>Inclusion</h4>
        <p>We realize the power of each individual and value our differences; pledging to actively maintain an environment that honors diversity - recognizing that our diversity makes us a stronger company. We will foster inclusion and embrace diversity throughout our business, our teams, and our culture.</p>
        
        <h4>Health</h4>
        <p>We foster curiosity and a health-conscious lifestyle for our team and customers.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 3,
    },

    // ========== ORDERS & SHIPPING ==========
    {
      category_id: categoryIds['orders-shipping'],
      title: 'How do I track my order?',
      slug: 'how-to-track-order',
      excerpt: 'Track your FiltersFast order with your order number and email.',
      content: `
        <h2>Tracking Your Order</h2>
        <p>Stay updated on your order status with our easy tracking options.</p>
        
        <h3>For Account Holders</h3>
        <ol>
          <li>Sign in to your account</li>
          <li>Go to "My Orders" in your dashboard</li>
          <li>Click on any order to see detailed tracking information</li>
        </ol>
        
        <h3>Guest Order Tracking</h3>
        <ol>
          <li>Visit the <a href="/track-order">Track Order</a> page</li>
          <li>Enter your order number (found in your confirmation email)</li>
          <li>Enter the email address used at checkout</li>
          <li>Click "Track Order" to view status</li>
        </ol>
        
        <h3>What You'll See</h3>
        <ul>
          <li><strong>Order Placed:</strong> We've received your order</li>
          <li><strong>Processing:</strong> Order is being prepared</li>
          <li><strong>Shipped:</strong> Package is on its way (tracking link provided)</li>
          <li><strong>Delivered:</strong> Package has arrived</li>
        </ul>
        
        <h3>Multiple Packages</h3>
        <p>If your order ships in multiple packages, you'll see separate tracking numbers for each package with the service type (FedEx, UPS, USPS, or DHL) listed.</p>
        
        <p><strong>Order not arrived?</strong> Contact us if it's been more than 7 business days since shipment.</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['orders-shipping'],
      title: 'Do you offer free shipping?',
      slug: 'free-shipping',
      excerpt: 'Learn about our free shipping policy and delivery times.',
      content: `
        <h2>Free Shipping Policy</h2>
        <p>Yes! We offer FREE shipping on most orders within the contiguous United States.</p>
        
        <h3>Free Shipping Eligibility</h3>
        <ul>
          <li>Standard orders to the contiguous US (48 states)</li>
          <li>All Home Filter Club subscription orders</li>
          <li>Most product categories including air, water, and pool filters</li>
        </ul>
        
        <h3>Delivery Time</h3>
        <p>Most orders ship within 1-2 business days and arrive within 5-7 business days from the ship date.</p>
        
        <h3>Shipping Carriers</h3>
        <p>We ship via FedEx, UPS, USPS, and DHL depending on your location and the items ordered.</p>
        
        <h3>Alaska, Hawaii & International</h3>
        <p>Shipping charges may apply for orders outside the contiguous US. The exact shipping cost will be calculated at checkout.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 2,
    },

    // ========== RETURNS & EXCHANGES ==========
    {
      category_id: categoryIds['returns-exchanges'],
      title: 'What is your return policy?',
      slug: 'return-policy',
      excerpt: 'Learn about our industry-leading 365-day return policy.',
      content: `
        <h2>Our 365-Day Return Policy</h2>
        <p>We stand behind our products with one of the best return policies in the industry.</p>
        
        <h3>Return Window</h3>
        <p><strong>365 days</strong> from the ship date. That's a full year to make sure you're completely satisfied!</p>
        
        <h3>What Can Be Returned?</h3>
        <p>Most items are eligible for return, including:</p>
        <ul>
          <li>Air filters</li>
          <li>Water filters</li>
          <li>Refrigerator filters</li>
          <li>Pool & spa filters</li>
          <li>Humidifier filters</li>
        </ul>
        
        <h3>Free Return Shipping</h3>
        <p><strong>FREE return shipping!</strong> We provide a prepaid return label for all eligible returns within the contiguous US.</p>
        
        <h3>How to Start a Return</h3>
        <ol>
          <li>Log into your account at <a href="/account">My Account</a></li>
          <li>Go to "My Orders"</li>
          <li>Click the "Return" button for the order you need to return</li>
          <li>Fill out the online return form</li>
          <li>Download your prepaid return label</li>
          <li>Ship the package back to us</li>
          <li>Receive your refund</li>
        </ol>
        
        <p><strong>Questions?</strong> Contact our returns team at returns@filtersfast.com</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['returns-exchanges'],
      title: 'What items cannot be returned?',
      slug: 'non-returnable-items',
      excerpt: 'Learn about our return policy exceptions and restrictions.',
      content: `
        <h2>Return Policy Exceptions</h2>
        <p>While we accept most returns within 365 days, there are some exceptions:</p>
        
        <h3>Non-Returnable Items</h3>
        <ul>
          <li><strong>Custom air filters:</strong> Returns and/or refunds on custom air filters are not accepted</li>
          <li><strong>Damaged during installation:</strong> FiltersFast will not issue refunds on products that were damaged during installation or because of incorrect installation</li>
        </ul>
        
        <h3>Return Conditions</h3>
        <ul>
          <li>Original shipping costs are not refunded</li>
          <li>Items must be unused and in original condition</li>
          <li>Original packaging is recommended but not required</li>
        </ul>
        
        <h3>Have Questions?</h3>
        <p>If you're unsure whether your item can be returned, please contact our customer service team at <a href="mailto:returns@filtersfast.com">returns@filtersfast.com</a> or call 1-866-438-3458.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 2,
    },

    // ========== PRODUCTS & FILTERS ==========
    {
      category_id: categoryIds['products-filters'],
      title: 'What are FiltersFast brand filters?',
      slug: 'filtersfast-brand',
      excerpt: 'Learn about our FiltersFast® brand air and water filters.',
      content: `
        <h2>FiltersFast® Brand Filters</h2>
        <p>Protect yourself and your family from the things you can't see. When it comes to filters for your home, you want to make sure that you're getting the best option at the best price. We are proud to have our own FiltersFast® brand for air and compatible water filters at a fraction of the cost of name brands.</p>
        
        <h3>Air & Furnace Filters</h3>
        <p>FiltersFast® Brand Air & Furnace Filters are proudly made in the United States and undergo rigorous testing to ensure that they meet MERV rating requirements.</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li>Tested using sensitive laboratory equipment to ensure they meet the requirements of their MERV rating</li>
          <li>Constructed with high quality pleated media and DO NOT contain fiberglass</li>
          <li>Available in MERV 13 ratings in 1-in., 2-in., 4-in., or 5-in. depth in the most common filter sizes</li>
          <li>Can be made in any custom air filter size</li>
        </ul>
        
        <h3>Water Filters</h3>
        <p>The FiltersFast® Brand has a wide selection of compatible water filter replacements for top refrigerator brands.</p>
        
        <h4>NSF Certification:</h4>
        <p>All FiltersFast® fridge filters are submitted for NSF certification. This process involves a meticulous process and adheres to NSF certification policies.</p>
        
        <p><a href="/our-brand">Learn more about FiltersFast® Brand →</a></p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['products-filters'],
      title: 'What does NSF certification mean?',
      slug: 'nsf-certification',
      excerpt: 'Understand NSF 42, 53, and 401 certifications for water filters.',
      content: `
        <h2>Understanding NSF Certification</h2>
        <p>NSF certification is an independent verification that water filters meet strict standards for contaminant reduction. Each NSF certification has a number to tell you what the filter is certified to reduce.</p>
        
        <h3>NSF 42 - Aesthetic Effects</h3>
        <p>NSF 42 certified means that the filter will reduce aesthetic contaminants. Aesthetic impurities are things like chlorine taste and odor.</p>
        <ul>
          <li>Reduces chlorine taste</li>
          <li>Reduces chlorine odor</li>
          <li>Improves water clarity</li>
        </ul>
        
        <h3>NSF 53 - Health Effects</h3>
        <p>NSF 53 means that the filter is certified to reduce contaminants that cause health effects like lead.</p>
        <ul>
          <li>Reduces lead</li>
          <li>Reduces cysts (cryptosporidium & giardia)</li>
          <li>Reduces other harmful contaminants</li>
        </ul>
        
        <h3>NSF 401 - Emerging Contaminants</h3>
        <p>NSF 401 means that the filter will reduce one or more of the 15 emerging contaminants from drinking water. Emerging contaminants include pharmaceuticals or chemicals not yet regulated by the EPA.</p>
        <ul>
          <li>Reduces pharmaceuticals</li>
          <li>Reduces over-the-counter medications</li>
          <li>Reduces herbicides and pesticides</li>
        </ul>
        
        <h3>FiltersFast® Certification</h3>
        <p>All FiltersFast® brand refrigerator filters are submitted for NSF certification to ensure they meet the highest standards for water quality and safety.</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 2,
    },
    {
      category_id: categoryIds['products-filters'],
      title: 'Can you make custom size air filters?',
      slug: 'custom-air-filters',
      excerpt: 'Yes! We can create custom air filters in any size you need.',
      content: `
        <h2>Custom Air Filters</h2>
        <p>Yes! FiltersFast® Brand air filters can be made in any custom size to fit your unique HVAC system.</p>
        
        <h3>How to Order</h3>
        <ol>
          <li>Visit our <a href="/custom-air-filters">Custom Air Filters</a> page</li>
          <li>Enter your exact dimensions (Length x Width x Depth)</li>
          <li>Select your desired MERV rating</li>
          <li>Choose quantity and frequency</li>
          <li>Complete your order</li>
        </ol>
        
        <h3>Available Options</h3>
        <ul>
          <li>Any custom size from 6" to 30" in length and width</li>
          <li>Multiple depth options: 1-in., 2-in., 4-in., or 5-in.</li>
          <li>MERV 13 rating for superior filtration</li>
          <li>Made in the USA with high-quality pleated media</li>
        </ul>
        
        <h3>Important Note</h3>
        <p><strong>Custom air filters cannot be returned or refunded</strong>, so please double-check your measurements before ordering. If you need help measuring, see our <a href="/support/products-filters/how-to-measure">How to Measure Your Air Filter</a> guide.</p>
        
        <h3>Delivery Time</h3>
        <p>Custom filters typically ship within 3-5 business days.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 3,
    },

    // ========== SUBSCRIBE & SAVE ==========
    {
      category_id: categoryIds['subscribe-save'],
      title: 'What is Home Filter Club?',
      slug: 'what-is-home-filter-club',
      excerpt: 'Learn about our Home Filter Club subscription service with automatic deliveries.',
      content: `
        <h2>Home Filter Club</h2>
        <p>Filtration essentials delivered on a customizable schedule.</p>
        
        <h3>Changing Your Home Filters Made Easy</h3>
        <p>We know you've got better things to do than remembering to change your home's filters, which is why we created the Home Filter Club. This customizable subscription service makes it easy to stay on top of making sure you regularly change your home's filters.</p>
        
        <h3>How It Works</h3>
        <ol>
          <li><strong>Shop</strong> for the filters you love</li>
          <li><strong>Customize</strong> your shopping cart</li>
          <li><strong>Schedule</strong> your desired delivery frequency</li>
          <li><strong>Enjoy</strong> checking "order filters" off your to-do list</li>
        </ol>
        
        <h3>Key Features</h3>
        <ul>
          <li><strong>Up to 10% off EVERY ORDER:</strong> Save up to 10% on FiltersFast® Brand products, 5% on other products</li>
          <li><strong>Always FREE Shipping:</strong> Get FREE shipping on every order with no minimum purchase required</li>
          <li><strong>Modify or Cancel ANY Time:</strong> Add, adjust, or cancel hassle-free with no hidden fees</li>
        </ul>
        
        <h3>Subscribe at Checkout</h3>
        <p>When you're ready to checkout, simply select the subscription option and choose your delivery frequency. We'll handle the rest!</p>
        
        <p><a href="/auto-delivery">Learn more about Home Filter Club →</a></p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['subscribe-save'],
      title: 'Why did I receive an order I didn\'t place?',
      slug: 'unexpected-subscription-order',
      excerpt: 'If you received an unexpected order, it may be a Home Filter Club subscription.',
      content: `
        <h2>Received an Unexpected Order?</h2>
        <p>If you have received an order that you did not place recently, it is likely a Home Filter Club order.</p>
        
        <h3>Understanding Your Subscription</h3>
        <p>On a previous order, you selected the option to join the Home Filter Club. A confirmation email was sent showing the enrollment into the auto-delivery program. We sent a reminder email 10 days before we shipped the subscription order and another email on the day of the order.</p>
        
        <h3>Managing Your Subscription</h3>
        <p>If you wish to cancel this or any future Home Filter Club orders:</p>
        <ol>
          <li>Log in to your account</li>
          <li>Go to the <a href="/account/subscriptions">Subscriptions</a> tab</li>
          <li>Cancel or modify your subscription</li>
        </ol>
        
        <h3>Need to Return?</h3>
        <p>If you would like to return merchandise you received:</p>
        <ol>
          <li><a href="/sign-in">Log in to your Account</a></li>
          <li>Click the Return button for the order you need to return</li>
          <li>Follow our online return process</li>
        </ol>
        
        <p>FiltersFast.com will provide you with a prepaid mailing label so that you can conveniently send the package(s) back.</p>
        
        <p><em>Note: We are only able to provide prepaid return shipping labels within the contiguous US. Read our complete <a href="/support/returns-exchanges/return-policy">Return Policy</a>.</em></p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 2,
    },
    {
      category_id: categoryIds['subscribe-save'],
      title: 'How do I update my payment method for subscriptions?',
      slug: 'update-subscription-payment',
      excerpt: 'Learn how to update your Home Filter Club subscription payment method.',
      content: `
        <h2>Update Subscription Payment Method</h2>
        <p>To update your Home Filter Club subscription payment method:</p>
        
        <h3>Step-by-Step Instructions</h3>
        <ol>
          <li><a href="/sign-in">Log in</a> to your account</li>
          <li>Go to the <a href="/account/settings">Payment Methods</a> page</li>
          <li>Click "Add Payment Method"</li>
          <li>Select the checkbox for <strong>"Default payment method"</strong> to associate the new payment method with your subscriptions</li>
          <li>Enter your payment information:
            <ul>
              <li>Name as it appears on your card (including any initials/prefixes)</li>
              <li>Card number</li>
              <li>Expiration date</li>
              <li>Security code</li>
            </ul>
          </li>
          <li>Click "Save Card" to complete the update</li>
        </ol>
        
        <h3>Important Notes</h3>
        <ul>
          <li>The default payment method will be used for all future Home Filter Club orders</li>
          <li>You can have multiple saved payment methods, but only one can be the default</li>
          <li>Changes take effect immediately for your next scheduled delivery</li>
        </ul>
        
        <p><strong>Need help?</strong> Contact our support team at <a href="mailto:support@filtersfast.com">support@filtersfast.com</a></p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 3,
    },
    {
      category_id: categoryIds['subscribe-save'],
      title: 'How do I change my subscription delivery date?',
      slug: 'change-subscription-date',
      excerpt: 'Put your subscription on hold or change the next delivery date.',
      content: `
        <h2>Change Your Subscription Delivery Date</h2>
        <p>You can easily adjust when your next Home Filter Club order will be delivered.</p>
        
        <h3>Steps to Change Delivery Date</h3>
        <ol>
          <li>Log into your account</li>
          <li>Click "Subscriptions" from the menu on the left side of the screen</li>
          <li>On the "My Next Order" tab, click <strong>"Edit Date"</strong></li>
          <li>A mini calendar will pop up</li>
          <li>Select the new date for your next order</li>
          <li>Click <strong>"OK"</strong> to finalize the change</li>
        </ol>
        
        <h3>Confirmation</h3>
        <p>You should now see the new date as the date of your next order, indicating that the change was successful.</p>
        
        <h3>Putting Your Order on Hold</h3>
        <p>If you need to skip an order or delay your delivery for several months, simply select a future date that works for your schedule. You can adjust the date as many times as needed at no charge.</p>
        
        <h3>Need to Cancel?</h3>
        <p>If you'd rather cancel your subscription entirely, visit our <a href="/support/subscribe-save/cancel-subscription">How to Cancel</a> guide.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 4,
    },
    {
      category_id: categoryIds['subscribe-save'],
      title: 'How do I add items to my subscription?',
      slug: 'add-items-to-subscription',
      excerpt: 'Learn how to add more products to your Home Filter Club subscription.',
      content: `
        <h2>Add Items to Your Subscription</h2>
        <p>You may make changes to your subscription online at any time.</p>
        
        <h3>Steps to Add Items</h3>
        <ol>
          <li>Log in to your FiltersFast Account</li>
          <li>Go to <a href="/account/subscriptions">Subscriptions</a></li>
          <li>Click the button titled <strong>"Add Items To My Auto Delivery"</strong></li>
          <li>Click "Start Shopping"</li>
        </ol>
        
        <h3>Shopping While Adding</h3>
        <p>You will be redirected to our homepage once you click on "Start Shopping". You'll be able to search for any item you'd like to add. When viewing a product page, you'll see an option to add it to your subscription - this will be presented in orange text with an orange frame around it.</p>
        
        <h3>Items You Can Add</h3>
        <ul>
          <li>Additional air filters</li>
          <li>Refrigerator filters</li>
          <li>Water filters</li>
          <li>Pool filters</li>
          <li>Humidifier filters</li>
          <li>Any other products we offer</li>
        </ul>
        
        <h3>Delivery Schedule</h3>
        <p>All items in your subscription will be delivered together on your scheduled delivery date. If different items need different replacement frequencies, you can create multiple subscriptions with different schedules.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 5,
    },
    {
      category_id: categoryIds['subscribe-save'],
      title: 'How do I cancel my subscription?',
      slug: 'cancel-subscription',
      excerpt: 'Cancel your Home Filter Club subscription at any time with no fees.',
      content: `
        <h2>Cancel Your Home Filter Club Subscription</h2>
        <p>You may cancel your Home Filter Club subscription at any time with no hidden fees or penalties.</p>
        
        <h3>Cancellation Steps</h3>
        <ol>
          <li>Log into your account</li>
          <li>Go to the <a href="/account/subscriptions">Subscriptions</a> page</li>
          <li>Click on the "My Subscriptions" tab</li>
          <li>Click <strong>"Cancel Subscription"</strong></li>
          <li>Choose a reason for cancellation (optional, helps us improve)</li>
          <li>Confirm cancellation</li>
        </ol>
        
        <h3>Confirmation</h3>
        <p>Your subscription is now cancelled, and you will receive an email confirming this. You will not be charged for any future deliveries.</p>
        
        <h3>Alternatives to Cancellation</h3>
        <p>Before canceling, consider these options:</p>
        <ul>
          <li><strong>Change delivery date:</strong> <a href="/support/subscribe-save/change-subscription-date">Put your next order on hold</a> for a few months</li>
          <li><strong>Adjust frequency:</strong> Change how often you receive orders</li>
          <li><strong>Modify items:</strong> Remove or add products to your subscription</li>
        </ul>
        
        <h3>Reactivating Later</h3>
        <p>If you cancel and want to rejoin later, simply place a new order and select the subscription option at checkout. Your account history and information will still be saved.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 6,
    },

    // ========== ACCOUNT & SETTINGS ==========
    {
      category_id: categoryIds['account-settings'],
      title: 'How do I reset my password?',
      slug: 'reset-password',
      excerpt: 'Reset your password if you\'ve forgotten it or need to change it.',
      content: `
        <h2>Reset Your Password</h2>
        <p>If you've forgotten your password or need to reset it, follow these steps:</p>
        
        <h3>Request Password Reset</h3>
        <ol>
          <li>Go to the <a href="/sign-in">Sign In</a> page</li>
          <li>Click <strong>"Forgot Password?"</strong></li>
          <li>Enter the email address associated with your account</li>
          <li>Click "Send Reset Link"</li>
        </ol>
        
        <h3>Check Your Email</h3>
        <p>We'll send you an email with instructions for resetting your password. If you don't receive this email within a few minutes:</p>
        <ul>
          <li>Check your spam or junk mail folder</li>
          <li>Make sure you entered the correct email address</li>
          <li>Try requesting another reset link</li>
        </ul>
        
        <h3>Create New Password</h3>
        <ol>
          <li>Click the link in the email (valid for 1 hour)</li>
          <li>Enter your new password (at least 8 characters with uppercase, lowercase, and numbers)</li>
          <li>Confirm your new password</li>
          <li>Click "Reset Password"</li>
        </ol>
        
        <h3>Password Requirements</h3>
        <p>Your password must:</p>
        <ul>
          <li>Be at least 8 characters long</li>
          <li>Contain at least one uppercase letter</li>
          <li>Contain at least one lowercase letter</li>
          <li>Contain at least one number</li>
        </ul>
        
        <p><strong>Still having trouble?</strong> Contact our support team at <a href="mailto:support@filtersfast.com">support@filtersfast.com</a></p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['account-settings'],
      title: 'How do I view my order history?',
      slug: 'view-order-history',
      excerpt: 'Access your complete order history and past purchases.',
      content: `
        <h2>View Your Order History</h2>
        <p>Your account gives you access to all your past orders and purchases.</p>
        
        <h3>Access Order History</h3>
        <ol>
          <li><a href="/sign-in">Sign in</a> to your account</li>
          <li>Go to <a href="/account/orders">My Orders</a></li>
          <li>View your complete order history</li>
        </ol>
        
        <h3>What You'll See</h3>
        <p>For each order, you can view:</p>
        <ul>
          <li>Order number and date</li>
          <li>Items ordered with quantities</li>
          <li>Order status and tracking information</li>
          <li>Shipping and billing addresses</li>
          <li>Payment method used</li>
          <li>Total amount paid</li>
        </ul>
        
        <h3>Order Actions</h3>
        <p>From your order history, you can:</p>
        <ul>
          <li><strong>Track shipments:</strong> Click on any order to see tracking details</li>
          <li><strong>Reorder:</strong> Quickly reorder items from past purchases</li>
          <li><strong>Return items:</strong> Initiate a return for eligible orders</li>
          <li><strong>Download invoices:</strong> Get PDF receipts for your records</li>
        </ul>
        
        <h3>Filtering & Search</h3>
        <p>Use the search and filter options to quickly find specific orders by date range, order number, or product.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 2,
    },

    // ========== PAYMENT & BILLING ==========
    {
      category_id: categoryIds['payment-billing'],
      title: 'What payment methods do you accept?',
      slug: 'payment-methods',
      excerpt: 'Learn about accepted payment methods including credit cards and PayPal.',
      content: `
        <h2>Accepted Payment Methods</h2>
        <p>We accept several secure payment methods to make your shopping experience convenient.</p>
        
        <h3>Credit & Debit Cards</h3>
        <p>We accept all major credit and debit cards:</p>
        <ul>
          <li>Visa</li>
          <li>Mastercard</li>
          <li>American Express</li>
          <li>Discover</li>
        </ul>
        
        <h3>PayPal</h3>
        <p>You can also checkout securely using your PayPal account for quick and easy payment.</p>
        
        <h3>Save Payment Methods</h3>
        <p>When you create an account, you can securely save your payment methods for faster checkout on future orders. Your payment information is encrypted and stored securely.</p>
        
        <h3>Security</h3>
        <p>All payment transactions are processed through secure, encrypted connections. We never store your full credit card number on our servers.</p>
        
        <h3>Subscription Payments</h3>
        <p>For Home Filter Club subscriptions, your saved default payment method will be charged automatically on your scheduled delivery date.</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
    {
      category_id: categoryIds['payment-billing'],
      title: 'When will my card be charged?',
      slug: 'when-charged',
      excerpt: 'Understand when your payment will be processed.',
      content: `
        <h2>Payment Processing Timeline</h2>
        <p>Understanding when your payment will be processed.</p>
        
        <h3>One-Time Orders</h3>
        <p>For regular orders, your payment method will be charged when your order is placed and confirmed. You'll receive an email confirmation with your order details.</p>
        
        <h3>Subscription Orders</h3>
        <p>For Home Filter Club subscriptions:</p>
        <ul>
          <li>Your card is charged when we prepare your shipment</li>
          <li>You'll receive a reminder email 10 days before your scheduled delivery</li>
          <li>You'll receive a confirmation email when your order is processed</li>
          <li>You'll receive a shipping notification when your order ships</li>
        </ul>
        
        <h3>Authorization Holds</h3>
        <p>When you place an order, you may see a temporary authorization hold on your card. This verifies that funds are available and typically processes as a full charge within 1-2 business days.</p>
        
        <h3>Refunds</h3>
        <p>If you return an item, refunds are typically processed within 5-7 business days of receiving your return. The funds may take an additional 3-5 business days to appear in your account depending on your bank.</p>
      `,
      is_published: true,
      is_featured: false,
      sort_order: 2,
    },
  ];

  articles.forEach(article => {
    const id = createArticle(article);
    console.log(`✅ Created article: ${article.title}`);
  });

  console.log(`\n✨ Support portal seeded successfully!`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Articles: ${articles.length}`);
  console.log('\n📍 Visit /support to see your new support portal!\n');

} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}

