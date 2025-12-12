import { NextRequest, NextResponse } from 'next/server';
import { getStripeOrThrow, formatAmountForStripe } from '@/lib/stripe';
import { getProductById } from '@/lib/db/products';
import { DonationSelection } from '@/lib/types/charity';
import { InsuranceSelection, validateInsurance } from '@/lib/types/insurance';

// OWASP: Input validation interfaces
interface CartItem {
  id: string | number;
  cartItemId?: string | number;
  productId?: string | number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  productType?: string;
  giftCardDetails?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  maxCartQty?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, donation, insurance } = body as {
      items: CartItem[];
      donation?: DonationSelection;
      insurance?: InsuranceSelection;
    };

    // OWASP: A03:2021 - Input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // OWASP: Validate all cart items
    const productCache = new Map<string, ReturnType<typeof getProductById>>();
    for (const item of items) {
      if (!item.id || !item.name || !item.price || !item.quantity) {
        return NextResponse.json(
          { error: 'Invalid cart items' },
          { status: 400 }
        );
      }
      
      if (!Number.isFinite(item.price) || item.price < 0 || item.price > 100000) {
        return NextResponse.json(
          { error: 'Invalid item price' },
          { status: 400 }
        );
      }
      
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
        return NextResponse.json(
          { error: 'Invalid item quantity' },
          { status: 400 }
        );
      }

      const isGiftCard = typeof item.productType === 'string' && item.productType.toLowerCase() === 'gift-card';

      if (!isGiftCard) {
        const normalizeProductIdentifier = (value: unknown): string | null => {
          if (value === null || value === undefined) return null;
          const normalized = String(value).trim();
          if (!normalized) return null;
          return normalized.length > 100 ? normalized.substring(0, 100) : normalized;
        };

        const lookupId =
          normalizeProductIdentifier(item.productId) ??
          normalizeProductIdentifier(item.id);

        if (lookupId) {
          let productRecord = productCache.get(lookupId);
          if (productRecord === undefined) {
            productRecord = getProductById(lookupId);
            productCache.set(lookupId, productRecord);
          }
          const maxCartQty = productRecord?.maxCartQty && productRecord.maxCartQty > 0
            ? productRecord.maxCartQty
            : null;
          if (maxCartQty && item.quantity > maxCartQty) {
            return NextResponse.json(
              { error: `Maximum quantity for ${productRecord?.name ?? 'this product'} is ${maxCartQty}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Calculate total amount with overflow protection
    const subtotal = items.reduce((sum: number, item: CartItem) => {
      const lineTotal = item.price * item.quantity;
      if (!Number.isFinite(lineTotal) || lineTotal < 0) {
        throw new Error('Invalid cart calculation');
      }
      return sum + lineTotal;
    }, 0);
    
    // OWASP: Prevent integer overflow
    if (!Number.isFinite(subtotal) || subtotal > Number.MAX_SAFE_INTEGER) {
      return NextResponse.json(
        { error: 'Cart total exceeds maximum' },
        { status: 400 }
      );
    }
    
    const requiresShipping = items.some(item => (item.productType ?? '').toLowerCase() !== 'gift-card');
    const shipping = requiresShipping ? (subtotal >= 99 ? 0 : 9.99) : 0;
    const total = subtotal + shipping;

    // Create line items for Stripe (already validated above)
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          // OWASP: XSS prevention - Stripe handles escaping, but we validate format
          name: String(item.name).substring(0, 250),
          description: `${String(item.brand).substring(0, 100)} - ${String(item.sku).substring(0, 100)}`,
          images: item.image ? [String(item.image).substring(0, 500)] : [],
        },
        unit_amount: formatAmountForStripe(item.price, 'usd'),
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (requiresShipping && shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping',
            images: [],
          },
          unit_amount: formatAmountForStripe(shipping, 'usd'),
        },
        quantity: 1,
      });
    }
    
    // Add shipping insurance as a line item if applicable
    if (requiresShipping && insurance && insurance.carrier !== 'none' && insurance.cost > 0) {
      // OWASP: Server-side validation of insurance selection
      const validation = validateInsurance(insurance.carrier, subtotal);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid insurance selection' },
          { status: 400 }
        );
      }
      
      // OWASP: Validate insurance cost is reasonable
      if (!Number.isFinite(insurance.cost) || insurance.cost < 0 || insurance.cost > subtotal) {
        return NextResponse.json(
          { error: 'Invalid insurance cost' },
          { status: 400 }
        );
      }
      
      // OWASP: Whitelist carrier type
      if (insurance.carrier !== 'standard' && insurance.carrier !== 'premium') {
        return NextResponse.json(
          { error: 'Invalid insurance type' },
          { status: 400 }
        );
      }
      
      const coverageType = insurance.carrier === 'premium' ? 'Premium' : 'Standard';
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Shipping Insurance - ${coverageType}`,
            description: `${coverageType} coverage for order protection (up to $${Math.floor(insurance.coverageAmount * 100) / 100})`,
            images: [],
          },
          unit_amount: formatAmountForStripe(insurance.cost, 'usd'),
        },
        quantity: 1,
      });
    }
    
    // Add donation as a line item if applicable
    if (donation && donation.amount > 0) {
      // OWASP: Validate donation amount
      if (!Number.isFinite(donation.amount) || donation.amount < 0 || donation.amount > 10000) {
        return NextResponse.json(
          { error: 'Invalid donation amount' },
          { status: 400 }
        );
      }
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Charitable Donation',
            // OWASP: Validate charityId format (alphanumeric only)
            description: `Donation to ${String(donation.charityId).replace(/[^a-zA-Z0-9-_]/g, '')}`,
            images: [],
          },
          unit_amount: formatAmountForStripe(donation.amount, 'usd'),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const stripe = getStripeOrThrow();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/checkout`,
      metadata: {
        // OWASP: Limit metadata size to prevent abuse
        items: JSON.stringify(items).substring(0, 4000),
        donation: donation ? JSON.stringify(donation).substring(0, 500) : '',
        insurance: insurance ? JSON.stringify(insurance).substring(0, 500) : '',
        // OWASP: A09:2021 - Security logging
        timestamp: new Date().toISOString(),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    // OWASP: A09:2021 - Secure logging without exposing sensitive data
    console.error('Checkout session error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      // Don't log full error details in production
    });
    
    // OWASP: A05:2021 - Generic error message to prevent information disclosure
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
