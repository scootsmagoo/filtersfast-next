/**
 * Initialize Workflows Database Tables
 */

import { initWorkflowTables } from '../lib/db/workflows';

console.log('🔧 Initializing workflows database tables...\n');

try {
  initWorkflowTables();
  console.log('\n✨ Workflow tables initialized successfully!\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

