'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';

export type CartItemId = string | number;

export interface GiftCardCartDetails {
  recipientName?: string;
  recipientEmail: string;
  message?: string;
  sendAt?: number | null;
  purchaserName?: string;
  purchaserEmail?: string;
}

export interface CartRewardSource {
  type: 'product' | 'deal';
  id: string | number;
  description?: string;
  parentProductId?: string;
}

interface RewardSyncItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  brand: string;
  image: string | null;
  quantity: number;
  price: number;
  productType?: string;
  rewardSource: CartRewardSource;
}

export interface CartItem {
  id: CartItemId;
  name: string;
  brand: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  productId?: string;
  productType?: string;
  metadata?: Record<string, unknown>;
  giftCardDetails?: GiftCardCartDetails;
  options?: Record<string, string>; // Selected option groups and options (optionGroupId -> optionId)
  subscription?: {
    enabled: boolean;
    frequency: number; // In months (1-12)
  };
  isReward?: boolean;
  rewardSource?: CartRewardSource;
  parentProductId?: string;
  maxCartQty?: number | null;
  retExclude?: 0 | 1 | 2;
  blockedReason?: string | null;
}

export interface AppliedGiftCardState {
  code: string;
  amountApplied: number;
  balanceRemaining: number;
  currency: string;
  originalBalance?: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  appliedGiftCards: AppliedGiftCardState[];
  appliedDeals: Array<{ id: number; description: string }>;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'ADD_ITEMS_BATCH'; payload: CartItem[] }
  | { type: 'REMOVE_ITEM'; payload: CartItemId }
  | { type: 'UPDATE_QUANTITY'; payload: { id: CartItemId; quantity: number } }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: { id: CartItemId; subscription?: { enabled: boolean; frequency: number } } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_STATE'; payload: CartState }
  | { type: 'APPLY_GIFT_CARD'; payload: AppliedGiftCardState }
  | { type: 'REMOVE_GIFT_CARD'; payload: string }
  | { type: 'CLEAR_GIFT_CARDS' }
  | { type: 'SYNC_REWARDS'; payload: { rewards: RewardSyncItem[]; appliedDeals: Array<{ id: number; description: string }> } };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  appliedGiftCards: [],
  appliedDeals: [],
};

function resolveMaxCartQty(value?: number | null): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const floored = Math.floor(value);
  if (floored <= 0) {
    return null;
  }

  return Math.min(floored, 999);
}

function clampQuantityToLimit(quantity: number, maxCartQty: number | null): number {
  const safeQuantity = Math.max(0, quantity);
  const limit = maxCartQty ?? 999;
  return Math.min(safeQuantity, limit);
}

function normalizeProductIdentifier(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.length > 100 ? normalized.slice(0, 100) : normalized;
}

function sanitizeCartItem(item: CartItem): CartItem {
  const normalizedMaxCartQty = resolveMaxCartQty(item.maxCartQty ?? null);
  const resolvedProductId =
    normalizeProductIdentifier(item.productId) ??
    normalizeProductIdentifier(item.id);
  return {
    ...item,
    productId: resolvedProductId ?? item.productId,
    maxCartQty: normalizedMaxCartQty,
    quantity: clampQuantityToLimit(item.quantity, normalizedMaxCartQty),
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const quantityToAdd = action.payload.quantity || 1;
      const payloadMaxCartQty = resolveMaxCartQty(action.payload.maxCartQty ?? null);
      const payload: CartItem = {
        ...action.payload,
        quantity: clampQuantityToLimit(quantityToAdd, payloadMaxCartQty),
        isReward: false,
        rewardSource: undefined,
        parentProductId: undefined,
        maxCartQty: payloadMaxCartQty,
      };
      const normalizedProductId =
        normalizeProductIdentifier(action.payload.productId) ??
        normalizeProductIdentifier(action.payload.id);
      if (normalizedProductId) {
        payload.productId = normalizedProductId;
      }
      
      // Check if item with same ID and options already exists
      const existingItem = state.items.find(item => {
        if (item.isReward) return false;
        if (item.id !== payload.id) return false;
        
        // Compare options (if both have options or both don't)
        const itemOptions = JSON.stringify(item.options || {});
        const payloadOptions = JSON.stringify(payload.options || {});
        return itemOptions === payloadOptions;
      });
      
      if (existingItem) {
        // Item with same options exists, update quantity
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id && 
          JSON.stringify(item.options || {}) === JSON.stringify(action.payload.options || {})
            ? (() => {
                const limit = resolveMaxCartQty(payload.maxCartQty ?? item.maxCartQty ?? null);
                const nextQuantity = clampQuantityToLimit(item.quantity + quantityToAdd, limit);
                return {
                  ...item,
                  quantity: nextQuantity,
                  maxCartQty: limit,
                };
              })()
            : item
        );
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        };
      } else {
        // New item or different options, add as separate item
        const limit = resolveMaxCartQty(action.payload.maxCartQty ?? null);
        const newItem: CartItem = {
          ...payload,
          quantity: clampQuantityToLimit(quantityToAdd, limit),
          maxCartQty: limit,
        };
        newItem.isReward = false;
        newItem.rewardSource = undefined;
        newItem.parentProductId = undefined;
        const updatedItems = [...state.items, newItem];
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          appliedDeals: state.appliedDeals,
        };
      }
      return state;
    }
    
    case 'ADD_ITEMS_BATCH': {
      // Batch add multiple items (for reorder functionality)
      let updatedItems = [...state.items];
      
      action.payload.forEach(newItem => {
        if (newItem.isReward) {
          return;
        }
        const normalizedIncoming = sanitizeCartItem({
          ...newItem,
          isReward: false,
          rewardSource: undefined,
          parentProductId: undefined,
        });
        const existingIndex = updatedItems.findIndex(item =>
          item.id === normalizedIncoming.id &&
          JSON.stringify(item.options || {}) === JSON.stringify(normalizedIncoming.options || {})
        );
        
        if (existingIndex >= 0) {
          // Item exists, add to quantity
          const existing = updatedItems[existingIndex];
          const limit = resolveMaxCartQty(normalizedIncoming.maxCartQty ?? existing.maxCartQty ?? null);
          updatedItems[existingIndex] = {
            ...existing,
            quantity: clampQuantityToLimit(existing.quantity + normalizedIncoming.quantity, limit),
            maxCartQty: limit,
          };
        } else {
          // New item, add to cart
          updatedItems.push(normalizedIncoming);
        }
      });
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        appliedDeals: state.appliedDeals,
      };
    }
    
    case 'REMOVE_ITEM': {
      const targetId = String(action.payload);
      const updatedItems = state.items.filter(item => {
        if (item.id === action.payload) {
          return false;
        }
        if (item.isReward) {
          const parentId = item.parentProductId ?? item.rewardSource?.parentProductId;
          if (parentId && String(parentId) === targetId) {
            return false;
          }
        }
        return true;
      });
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        appliedDeals: state.appliedDeals,
      };
    }
    
    case 'UPDATE_SUBSCRIPTION': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, subscription: action.payload.subscription }
          : item
      );
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const mappedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          if (item.isReward) {
            return item;
          }
          const limit = resolveMaxCartQty(item.maxCartQty ?? null);
          return {
            ...item,
            quantity: clampQuantityToLimit(action.payload.quantity, limit),
            maxCartQty: limit,
          };
        }
        return item;
      });

      const activeBaseIds = new Set(
        mappedItems
          .filter(item => !item.isReward && item.quantity > 0)
          .map(item => String(item.id))
      );

      const updatedItems = mappedItems.filter(item => {
        if (item.isReward) {
          const parentId = item.parentProductId ?? item.rewardSource?.parentProductId;
          if (parentId) {
            return activeBaseIds.has(String(parentId));
          }
          return false;
        }
        return item.quantity > 0;
      });
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        appliedDeals: state.appliedDeals,
      };
    }
    
    case 'CLEAR_CART':
      return { ...initialState };
    
    case 'LOAD_STATE': {
      const sanitizedItems = action.payload.items.map(sanitizeCartItem);
      return {
        items: sanitizedItems,
        total: sanitizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: sanitizedItems.reduce((sum, item) => sum + item.quantity, 0),
        appliedGiftCards: action.payload.appliedGiftCards,
        appliedDeals: action.payload.appliedDeals ?? [],
      };
    }

    case 'APPLY_GIFT_CARD': {
      const existing = state.appliedGiftCards.find(card => card.code.toLowerCase() === action.payload.code.toLowerCase());
      if (existing) {
        const updatedGiftCards = state.appliedGiftCards.map(card =>
          card.code.toLowerCase() === action.payload.code.toLowerCase() ? action.payload : card
        );
        return {
          ...state,
          appliedGiftCards: updatedGiftCards,
        };
      }

      return {
        ...state,
        appliedGiftCards: [...state.appliedGiftCards, action.payload],
      };
    }

    case 'REMOVE_GIFT_CARD':
      return {
        ...state,
        appliedGiftCards: state.appliedGiftCards.filter(
          card => card.code.toLowerCase() !== action.payload.toLowerCase()
        ),
      };

    case 'CLEAR_GIFT_CARDS':
      return {
        ...state,
        appliedGiftCards: [],
      };
    
    case 'SYNC_REWARDS': {
      const nonRewardItems = state.items.filter(item => !item.isReward);
      const rewardItems: CartItem[] = action.payload.rewards.map(reward => ({
        id: reward.id,
        productId: normalizeProductIdentifier(reward.productId) ?? reward.productId,
        name: reward.name,
        brand: reward.brand,
        sku: reward.sku,
        price: reward.price,
        image: reward.image || '',
        quantity: reward.quantity,
        productType: reward.productType,
        metadata: undefined,
        giftCardDetails: undefined,
        options: undefined,
        subscription: undefined,
        isReward: true,
        rewardSource: reward.rewardSource,
        parentProductId: normalizeProductIdentifier(reward.rewardSource.parentProductId),
      }));

      const updatedItems = [...nonRewardItems, ...rewardItems];

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        appliedDeals: action.payload.appliedDeals,
      };
    }
    
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { data: session, isPending } = useSession();
  
  // Get the appropriate cart key based on user authentication
  const getCartKey = (userId?: string) => {
    if (userId) {
      return `filtersfast-cart-user-${userId}`;
    }
    return 'filtersfast-cart-anonymous';
  };

  // Load cart from localStorage when user session changes
  useEffect(() => {
    // Wait for session to be loaded
    if (isPending) return;

    const currentUserId = session?.user?.id;
    const cartKey = getCartKey(currentUserId);
    
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          // Backwards compatibility with older cart format (items only)
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              items: parsed as CartItem[],
              total: 0,
              itemCount: 0,
              appliedGiftCards: [],
              appliedDeals: [],
            },
          });
        } else if (parsed && typeof parsed === 'object') {
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          const appliedGiftCards = Array.isArray(parsed.appliedGiftCards)
            ? parsed.appliedGiftCards
            : [];
          const appliedDeals = Array.isArray(parsed.appliedDeals)
            ? parsed.appliedDeals
            : [];

          dispatch({
            type: 'LOAD_STATE',
            payload: {
              items,
              total: 0,
              itemCount: 0,
              appliedGiftCards,
              appliedDeals,
            },
          });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        dispatch({ type: 'CLEAR_CART' });
      }
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [session?.user?.id, isPending]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Don't save until session is loaded
    if (isPending) return;
    
    const currentUserId = session?.user?.id;
    const cartKey = getCartKey(currentUserId);
    const serializedState = JSON.stringify({
      items: state.items,
      appliedGiftCards: state.appliedGiftCards,
      appliedDeals: state.appliedDeals,
    });
    localStorage.setItem(cartKey, serializedState);
  }, [state.items, state.appliedGiftCards, session?.user?.id, isPending]);

  const rewardSyncSignatureRef = useRef<string>('');

  useEffect(() => {
    if (isPending) return;

    const baseItems = state.items.filter(item => !item.isReward);
    const signature = JSON.stringify(
      baseItems.map(item => ({
        id: normalizeProductIdentifier(item.id) ?? item.id,
        productId: normalizeProductIdentifier(item.productId) ?? item.productId ?? null,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
      }))
    );

    if (signature === rewardSyncSignatureRef.current) {
      return;
    }
    rewardSyncSignatureRef.current = signature;

    if (baseItems.length === 0) {
      dispatch({
        type: 'SYNC_REWARDS',
        payload: {
          rewards: [],
          appliedDeals: [],
        },
      });
      return;
    }

    const controller = new AbortController();

    const payload = {
      items: baseItems.map(item => ({
        cartItemId: normalizeProductIdentifier(item.id) ?? item.id,
        productId:
          normalizeProductIdentifier(item.productId) ??
          normalizeProductIdentifier(item.id) ??
          item.productId ??
          item.id,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: baseItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    (async () => {
      try {
        const response = await fetch('/api/cart/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to sync rewards');
        }

        const data = await response.json();
        if (data?.success) {
          dispatch({
            type: 'SYNC_REWARDS',
            payload: {
              rewards: data.rewards || [],
              appliedDeals: data.appliedDeals || [],
            },
          });
        } else {
          dispatch({
            type: 'SYNC_REWARDS',
            payload: {
              rewards: [],
              appliedDeals: [],
            },
          });
        }
      } catch (error) {
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        console.error('Cart reward sync failed:', error);
        dispatch({
          type: 'SYNC_REWARDS',
          payload: {
            rewards: [],
            appliedDeals: [],
          },
        });
      }
    })();

    return () => controller.abort();
  }, [state.items, isPending, dispatch]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  // Helper functions for easier cart management
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    context.dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const addItemsBatch = (items: CartItem[]) => {
    context.dispatch({ type: 'ADD_ITEMS_BATCH', payload: items });
  };
  
  const removeItem = (id: CartItemId) => {
    context.dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: CartItemId, quantity: number) => {
    context.dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const updateSubscription = (id: CartItemId, subscription?: { enabled: boolean; frequency: number }) => {
    context.dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: { id, subscription } });
  };
  
  const clearCart = () => {
    context.dispatch({ type: 'CLEAR_CART' });
  };
  
  const applyGiftCard = (giftCard: AppliedGiftCardState) => {
    context.dispatch({ type: 'APPLY_GIFT_CARD', payload: giftCard });
  };

  const removeGiftCard = (code: string) => {
    context.dispatch({ type: 'REMOVE_GIFT_CARD', payload: code });
  };

  const clearGiftCards = () => {
    context.dispatch({ type: 'CLEAR_GIFT_CARDS' });
  };
  
  const getItemQuantity = (id: CartItemId): number => {
    const item = context.state.items.find(item => item.id === id);
    return item ? item.quantity : 0;
  };
  
  const isInCart = (id: CartItemId): boolean => {
    return context.state.items.some(item => item.id === id);
  };
  
  return {
    ...context.state,
    dispatch: context.dispatch,
    addItem,
    addItemsBatch,
    removeItem,
    updateQuantity,
    updateSubscription,
    clearCart,
    applyGiftCard,
    removeGiftCard,
    clearGiftCards,
    getItemQuantity,
    isInCart,
  };
}
