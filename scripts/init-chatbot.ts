/**
 * Initialize Chatbot Tables
 * Creates the chatbot_conversations table in the database
 */

import { initializeSupportTables } from '../lib/db/support';

console.log('🤖 Initializing chatbot tables...');

try {
  initializeSupportTables();
  console.log('✅ Chatbot tables created successfully!');
  console.log('');
  console.log('The following table was created:');
  console.log('  - chatbot_conversations (session tracking and message history)');
  console.log('');
  console.log('You can now use the AI chatbot! 🎉');
} catch (error) {
  console.error('❌ Error creating chatbot tables:', error);
  process.exit(1);
}

