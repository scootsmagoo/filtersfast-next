import { NextRequest, NextResponse } from 'next/server';
import { getStripeOrThrow, formatAmountForStripe } from '@/lib/stripe';
import { DonationSelection } from '@/lib/types/charity';

export async function POST(request: NextRequest) {
  try {
    const { items, donation } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 99 ? 0 : 9.99;
    const total = subtotal + shipping;

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `${item.brand} - ${item.sku}`,
          images: [item.image],
        },
        unit_amount: formatAmountForStripe(item.price, 'usd'),
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping',
          },
          unit_amount: formatAmountForStripe(shipping, 'usd'),
        },
        quantity: 1,
      });
    }
    
    // Add donation as a line item if applicable
    if (donation && donation.amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Charitable Donation',
            description: `Donation to ${donation.charityId}`,
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
        items: JSON.stringify(items),
        donation: donation ? JSON.stringify(donation) : '',
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
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
