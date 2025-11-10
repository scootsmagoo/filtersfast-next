'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
  | { type: 'CLEAR_GIFT_CARDS' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  appliedGiftCards: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const quantityToAdd = action.payload.quantity || 1;
      
      // Check if item with same ID and options already exists
      const existingItem = state.items.find(item => {
        if (item.id !== action.payload.id) return false;
        
        // Compare options (if both have options or both don't)
        const itemOptions = JSON.stringify(item.options || {});
        const payloadOptions = JSON.stringify(action.payload.options || {});
        return itemOptions === payloadOptions;
      });
      
      if (existingItem) {
        // Item with same options exists, update quantity
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id && 
          JSON.stringify(item.options || {}) === JSON.stringify(action.payload.options || {})
            ? { ...item, quantity: item.quantity + quantityToAdd }
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
        const newItem = { ...action.payload, quantity: quantityToAdd };
        const updatedItems = [...state.items, newItem];
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        };
      }
    }
    
    case 'ADD_ITEMS_BATCH': {
      // Batch add multiple items (for reorder functionality)
      let updatedItems = [...state.items];
      
      action.payload.forEach(newItem => {
        const existingIndex = updatedItems.findIndex(item => item.id === newItem.id);
        
        if (existingIndex >= 0) {
          // Item exists, add to quantity
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + newItem.quantity,
          };
        } else {
          // New item, add to cart
          updatedItems.push(newItem);
        }
      });
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
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
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    }
    
    case 'CLEAR_CART':
      return { ...initialState };
    
    case 'LOAD_STATE':
      return {
        items: action.payload.items,
        total: action.payload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: action.payload.items.reduce((sum, item) => sum + item.quantity, 0),
        appliedGiftCards: action.payload.appliedGiftCards,
      };

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
            },
          });
        } else if (parsed && typeof parsed === 'object') {
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          const appliedGiftCards = Array.isArray(parsed.appliedGiftCards)
            ? parsed.appliedGiftCards
            : [];

          dispatch({
            type: 'LOAD_STATE',
            payload: {
              items,
              total: 0,
              itemCount: 0,
              appliedGiftCards,
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
    });
    localStorage.setItem(cartKey, serializedState);
  }, [state.items, state.appliedGiftCards, session?.user?.id, isPending]);

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
