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

  // Create sample articles (you can add more later via admin)
  const articles = [
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
        
        <p><strong>Order not arrived?</strong> Contact us if it's been more than 7 business days since shipment.</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
    },
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
        <p><strong>FREE return shipping!</strong> We provide a prepaid return label for all eligible returns.</p>
        
        <h3>How to Start a Return</h3>
        <ol>
          <li>Visit <a href="/returns">Returns Page</a></li>
          <li>Enter your order information</li>
          <li>Select items to return and reason</li>
          <li>Download your prepaid return label</li>
          <li>Ship the package back to us</li>
        </ol>
        
        <p><strong>Questions?</strong> Contact our returns team at returns@filtersfast.com</p>
      `,
      is_published: true,
      is_featured: true,
      sort_order: 1,
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

