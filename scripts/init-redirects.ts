/**
 * Initialize URL Redirects System
 * 
 * Run this script to set up the redirects table and seed example redirects.
 */

import { initRedirectsTable, createRedirect, CreateRedirectInput, getActiveRedirects } from '../lib/db/redirects';
import { setRedirectCache } from '../lib/redirects-cache';

console.log('🚀 Initializing URL Redirects System...\n');

// Initialize the table
initRedirectsTable();

// Seed some example redirects
console.log('\n📝 Seeding example redirects...\n');

const exampleRedirects: CreateRedirectInput[] = [
  {
    source_path: '/old-product-page',
    destination_path: '/products/new-product',
    redirect_type: '301',
    description: 'Product page migration',
    is_active: true
  },
  {
    source_path: '/blog/old-article',
    destination_path: '/blog/new-article',
    redirect_type: '301',
    description: 'Blog post URL update',
    is_active: true
  },
  {
    source_path: '/promo',
    destination_path: '/deals',
    redirect_type: '302',
    description: 'Temporary promotional redirect',
    is_active: true
  },
  {
    source_path: '/category/filters',
    destination_path: '/air-filters',
    redirect_type: '301',
    description: 'Category restructure',
    is_active: true
  }
];

exampleRedirects.forEach(redirect => {
  try {
    createRedirect(redirect);
    console.log(`✅ Created redirect: ${redirect.source_path} → ${redirect.destination_path}`);
  } catch (error) {
    console.error(`❌ Failed to create redirect: ${redirect.source_path}`, error);
  }
});

console.log('\n📦 Loading redirects into cache...\n');

// Load active redirects into cache
const activeRedirects = getActiveRedirects();
setRedirectCache(activeRedirects);
console.log(`✅ Loaded ${activeRedirects.length} active redirects into cache`);

console.log('\n✅ URL Redirects system initialized successfully!\n');
console.log('📊 Next steps:');
console.log('  1. Access admin panel at /admin/redirects');
console.log('  2. Add/edit redirects via the admin UI');
console.log('  3. Cache auto-refreshes when redirects are modified\n');

