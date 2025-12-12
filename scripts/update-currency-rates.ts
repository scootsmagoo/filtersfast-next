/**
 * Update Currency Exchange Rates
 * Fetches latest exchange rates from Open Exchange Rates API
 * Run this script periodically (e.g., daily via cron) to keep rates up to date
 */

import { updateCurrencyRates, getAllCurrencyRates } from '../lib/db/currency';

const OPEN_EXCHANGE_RATES_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID || '98b49fece17a41309e612cf60c5a4bba';
const API_URL = `https://openexchangerates.org/api/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}`;

async function updateRates() {
  console.log('🔄 Fetching latest exchange rates...\n');
  
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid API response: missing rates');
    }
    
    // Extract the currencies we support
    const ratesToUpdate: Record<string, number> = {
      CAD: data.rates.CAD,
      AUD: data.rates.AUD,
      EUR: data.rates.EUR,
      GBP: data.rates.GBP,
    };
    
    console.log('📊 Exchange Rates (relative to USD):');
    console.log('   CAD:', ratesToUpdate.CAD);
    console.log('   AUD:', ratesToUpdate.AUD);
    console.log('   EUR:', ratesToUpdate.EUR);
    console.log('   GBP:', ratesToUpdate.GBP);
    console.log('');
    
    // Update database
    const updated = updateCurrencyRates(ratesToUpdate);
    console.log(`✅ Updated ${updated} currency rates`);
    
    // Display current rates from database
    console.log('\n📈 Current rates in database:');
    const currentRates = getAllCurrencyRates();
    for (const rate of currentRates) {
      const lastUpdated = new Date(rate.lastUpdated);
      console.log(`   ${rate.code}: ${rate.rate.toFixed(4)} (${rate.symbol}) - Updated: ${lastUpdated.toLocaleString()}`);
    }
    
    console.log('\n✨ Currency rates updated successfully!\n');
  } catch (error: any) {
    console.error('❌ Error updating currency rates:', error.message);
    process.exit(1);
  }
}

updateRates();

