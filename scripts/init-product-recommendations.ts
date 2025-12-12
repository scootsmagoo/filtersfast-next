/**
 * Initialize Product Recommendations Schema
 * Run this script to set up the recommendations database tables
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');
const schemaPath = join(process.cwd(), 'database', 'product-recommendations-schema.sql');

function initRecommendationsSchema() {
  console.log('Initializing Product Recommendations schema...');
  
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  try {
    // Read and execute schema file
    const schema = readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    
    console.log('✅ Product Recommendations schema initialized successfully!');
    console.log('\nTables created:');
    console.log('  - product_views');
    console.log('  - product_co_purchases');
    console.log('  - product_recommendations');
    console.log('  - recommendation_clicks');
    console.log('  - user_product_interactions');
    console.log('  - recommendation_performance');
    console.log('  - recommendation_rules');
    console.log('\nViews created:');
    console.log('  - view_top_co_purchases');
    console.log('  - view_product_recommendations_summary');
    console.log('  - view_recommendation_performance_summary');
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initRecommendationsSchema();

