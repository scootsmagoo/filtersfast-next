/**
 * Seed Sample Promo Codes
 * Run with: npx tsx scripts/seed-promo-codes.ts
 */

import { createPromoCode } from '../lib/db/promo-codes'

const samplePromoCodes = [
  {
    code: 'SAVE20',
    description: '20% off your entire order',
    discountType: 'percentage' as const,
    discountValue: 20,
    minOrderAmount: 50,
    maxDiscount: 100,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 1000,
    perCustomerLimit: 1,
    firstTimeOnly: false,
    active: true
  },
  {
    code: 'WELCOME10',
    description: 'Welcome! Get 10% off your first order',
    discountType: 'percentage' as const,
    discountValue: 10,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: undefined,
    perCustomerLimit: 1,
    firstTimeOnly: true,
    active: true
  },
  {
    code: 'FREESHIP',
    description: 'Free shipping on any order',
    discountType: 'free_shipping' as const,
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: undefined,
    perCustomerLimit: 2,
    firstTimeOnly: false,
    active: true
  },
  {
    code: 'FILTER25',
    description: '$25 off orders over $100',
    discountType: 'fixed' as const,
    discountValue: 25,
    minOrderAmount: 100,
    maxDiscount: undefined,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 500,
    perCustomerLimit: 1,
    firstTimeOnly: false,
    active: true
  },
  {
    code: 'BULK15',
    description: '15% off bulk orders over $200',
    discountType: 'percentage' as const,
    discountValue: 15,
    minOrderAmount: 200,
    maxDiscount: 150,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: undefined,
    perCustomerLimit: undefined,
    firstTimeOnly: false,
    active: true
  }
]

async function seedPromoCodes() {
  console.log('🌱 Seeding promo codes...\n')
  
  try {
    for (const promo of samplePromoCodes) {
      try {
        const created = createPromoCode(promo)
        console.log(`✅ Created promo code: ${created.code}`)
        console.log(`   Description: ${created.description}`)
        console.log(`   Type: ${created.discountType} (${created.discountValue}${created.discountType === 'percentage' ? '%' : '$'})`)
        console.log(`   Min Order: ${created.minOrderAmount ? '$' + created.minOrderAmount : 'None'}`)
        console.log('')
      } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
          console.log(`⏭️  Skipped ${promo.code} (already exists)`)
        } else {
          console.error(`❌ Error creating ${promo.code}:`, error.message)
        }
      }
    }
    
    console.log('\n✨ Promo code seeding complete!')
    console.log('\nAvailable promo codes:')
    console.log('  - SAVE20: 20% off orders over $50')
    console.log('  - WELCOME10: 10% off first order (first-time customers only)')
    console.log('  - FREESHIP: Free shipping on any order')
    console.log('  - FILTER25: $25 off orders over $100')
    console.log('  - BULK15: 15% off orders over $200')
    
  } catch (error) {
    console.error('❌ Error seeding promo codes:', error)
    process.exit(1)
  }
}

seedPromoCodes()

