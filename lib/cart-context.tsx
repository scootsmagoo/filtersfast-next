'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
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
      const existingItem = state.items.find(item => item.id === action.payload.id);
      const quantityToAdd = action.payload.quantity || 1;
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('filtersfast-cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('filtersfast-cart', JSON.stringify(state.items));
  }, [state.items]);

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
    clearCart,
    getItemQuantity,
    isInCart,
  };
}
