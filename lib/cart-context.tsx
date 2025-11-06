'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';

export interface CartItem {
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  options?: Record<string, string>; // Selected option groups and options (optionGroupId -> optionId)
  subscription?: {
    enabled: boolean;
    frequency: number; // In months (1-12)
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'ADD_ITEMS_BATCH'; payload: CartItem[] }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: { id: number; subscription?: { enabled: boolean; frequency: number } } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
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
      return initialState;
    
    case 'LOAD_CART':
      return {
        items: action.payload,
        total: action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: action.payload.reduce((sum, item) => sum + item.quantity, 0),
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
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        dispatch({ type: 'CLEAR_CART' });
      }
    } else {
      // Clear cart if no saved cart exists for this user
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [session?.user?.id, isPending]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Don't save until session is loaded
    if (isPending) return;
    
    const currentUserId = session?.user?.id;
    const cartKey = getCartKey(currentUserId);
    localStorage.setItem(cartKey, JSON.stringify(state.items));
  }, [state.items, session?.user?.id, isPending]);

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
  
  const removeItem = (id: number) => {
    context.dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: number, quantity: number) => {
    context.dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const updateSubscription = (id: number, subscription?: { enabled: boolean; frequency: number }) => {
    context.dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: { id, subscription } });
  };
  
  const clearCart = () => {
    context.dispatch({ type: 'CLEAR_CART' });
  };
  
  const getItemQuantity = (id: number): number => {
    const item = context.state.items.find(item => item.id === id);
    return item ? item.quantity : 0;
  };
  
  const isInCart = (id: number): boolean => {
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
    getItemQuantity,
    isInCart,
  };
}
