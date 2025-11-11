/**
 * Cart Reward Calculator
 * POST - Given cart line items, returns auto-added gift with purchase rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProductById, getProductBySKU } from '@/lib/db/products';
import { getApplicableDeal } from '@/lib/db/deals';

const MAX_ITEMS = 100;

const cartItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  productId: z.union([z.string(), z.number()]).optional(),
  sku: z.string().optional(),
  quantity: z.number().int().min(1).max(999),
  price: z.number().min(0).max(999999.99).optional(),
});

const requestSchema = z.object({
  items: z.array(cartItemSchema).max(MAX_ITEMS),
  subtotal: z.number().min(0).max(99999999.99).optional(),
});

type CartItemInput = z.infer<typeof cartItemSchema>;

function normalizeProductId(item: CartItemInput): string | null {
  if (typeof item.productId === 'string') {
    return item.productId;
  }
  if (typeof item.productId === 'number') {
    return String(item.productId);
  }
  if (typeof item.id === 'string') {
    return item.id;
  }
  if (typeof item.id === 'number') {
    return String(item.id);
  }
  return null;
}

function buildRewardId(source: string, sourceId: string | number, productId: string): string {
  return `reward:${source}:${sourceId}:${productId}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, subtotal } = requestSchema.parse(body);

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        rewards: [],
        appliedDeals: [],
      });
    }

    const baseItems: Array<{
      id: string;
      sku: string;
      name: string;
      brand: string;
      productType: string;
      image: string | null;
      quantity: number;
      price: number;
      giftWithPurchaseProductId: string | null;
      giftWithPurchaseQuantity: number;
      giftWithPurchaseAutoAdd: boolean;
    }> = [];

    let computedSubtotal = 0;

    for (const item of items) {
      const quantity = item.quantity;
      const normalizedProductId = normalizeProductId(item);
      let product =
        (normalizedProductId && getProductById(normalizedProductId)) ||
        (item.sku ? getProductBySKU(item.sku) : null);

      if (!product) {
        // Skip unknown items but continue processing
        continue;
      }

      const linePrice =
        typeof item.price === 'number'
          ? Math.min(item.price, 999999.99)
          : product.price;

      const safeUnitPrice = Number.isFinite(linePrice) ? linePrice : product.price;

      computedSubtotal += safeUnitPrice * quantity;

      baseItems.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        productType: product.type,
        image: product.primaryImage,
        quantity,
        price: safeUnitPrice,
        giftWithPurchaseProductId: product.giftWithPurchaseProductId,
        giftWithPurchaseQuantity: product.giftWithPurchaseQuantity || 1,
        giftWithPurchaseAutoAdd: product.giftWithPurchaseAutoAdd,
      });
    }

    const effectiveSubtotal =
      typeof subtotal === 'number' && subtotal >= 0 ? subtotal : computedSubtotal;

    const rewardMap = new Map<
      string,
      {
        id: string;
        productId: string;
        sku: string;
        name: string;
        brand: string;
        image: string | null;
        quantity: number;
        price: number;
        productType: string;
        rewardSource: {
          type: 'product' | 'deal';
          id: string | number;
          description?: string;
          parentProductId?: string;
        };
      }
    >();

    const appliedDeals: Array<{ id: number; description: string }> = [];

    // Product-level rewards
    for (const item of baseItems) {
      if (!item.giftWithPurchaseProductId || !item.giftWithPurchaseAutoAdd) {
        continue;
      }

      const rewardProduct = getProductById(item.giftWithPurchaseProductId);
      if (!rewardProduct) {
        continue;
      }

      const rewardId = buildRewardId('product', item.id, rewardProduct.id);
      const existingReward = rewardMap.get(rewardId);
      const rewardQuantity = Math.min(100, Math.max(1, item.giftWithPurchaseQuantity));

      if (existingReward) {
        existingReward.quantity += rewardQuantity;
      } else {
        rewardMap.set(rewardId, {
          id: rewardId,
          productId: rewardProduct.id,
          sku: rewardProduct.sku,
          name: rewardProduct.name,
          brand: rewardProduct.brand,
          image: rewardProduct.primaryImage,
          quantity: rewardQuantity,
          price: 0,
          productType: rewardProduct.type,
          rewardSource: {
            type: 'product',
            id: item.id,
            parentProductId: item.id,
          },
        });
      }
    }

    // Deal-level rewards
    const applicableDeal = getApplicableDeal(effectiveSubtotal);
    if (applicableDeal && applicableDeal.rewardSkus.length > 0 && applicableDeal.rewardAutoAdd) {
      appliedDeals.push({
        id: applicableDeal.iddeal,
        description: applicableDeal.dealdiscription,
      });

      for (const rewardSku of applicableDeal.rewardSkus) {
        const rewardProduct = getProductBySKU(rewardSku.sku);
        if (!rewardProduct) {
          continue;
        }

        const rewardQuantity = Math.min(100, Math.max(1, rewardSku.quantity || 1));
        const priceOverride =
          rewardSku.priceOverride !== undefined && rewardSku.priceOverride !== null
            ? Math.min(Math.max(0, rewardSku.priceOverride), 999999.99)
            : 0;

        const rewardId = buildRewardId('deal', applicableDeal.iddeal, rewardProduct.id);
        const existingReward = rewardMap.get(rewardId);

        if (existingReward) {
          existingReward.quantity += rewardQuantity;
          existingReward.price = priceOverride;
        } else {
          rewardMap.set(rewardId, {
            id: rewardId,
            productId: rewardProduct.id,
            sku: rewardProduct.sku,
            name: rewardProduct.name,
            brand: rewardProduct.brand,
            image: rewardProduct.primaryImage,
            quantity: rewardQuantity,
            price: priceOverride,
            productType: rewardProduct.type,
            rewardSource: {
              type: 'deal',
              id: applicableDeal.iddeal,
              description: applicableDeal.dealdiscription,
            },
          });
        }
      }
    }

    const rewards = Array.from(rewardMap.values());

    return NextResponse.json({
      success: true,
      rewards,
      appliedDeals,
    });
  } catch (error) {
    console.error('Error calculating cart rewards:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to calculate rewards' },
      { status: 500 }
    );
  }
}

