'use client';

import { CartItemWithDetails } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

// Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  product_images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string;
  object_path: string;
  bucket_name: string;
  view_type: string;
  visibility: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  uploaded_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  item_type: 'cart' | 'save_for_later';
  added_at: string;
  updated_at: string;
  product_variant?: ProductVariant;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CartResponse {
  cart: Cart | null;
  cartItems: CartItemWithDetails[];
}

interface UseCartReturn {
  // State
  cart: Cart | null;
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  
  // Cart info
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  
  // Actions
  addToCart: (productVariantId: string, quantity?: number, itemType?: 'cart' | 'save_for_later') => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  moveToSaveForLater: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Utilities
  getCartItem: (productVariantId: string) => CartItem | undefined;
  isInCart: (productVariantId: string) => boolean;
}

export function useCart(): UseCartReturn {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived values
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const cartTotal = cartItems.reduce((total, item) => {
    if (!item.product_variant) return total;
    
    const productPrice = item.product_variant.product?.base_price || 0;
    const priceAdjustment = item.product_variant.price_adjustment || 0;
    const finalPrice = productPrice + priceAdjustment;
    
    return total + (finalPrice * item.quantity);
  }, 0);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!userId || !authLoaded) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data: CartResponse = await response.json();
      setCart(data.cart);
      setCartItems(data.cartItems || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [userId, authLoaded]);

  // Initial cart load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = useCallback(async (
    productVariantId: string, 
    quantity: number = 1, 
    itemType: 'cart' | 'save_for_later' = 'cart'
  ) => {
    if (!userId) {
      setError('You must be logged in to add items to cart');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_variant_id: productVariantId,
          quantity,
          item_type: itemType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      // Refresh cart to get updated data
      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      throw err; // Re-throw to allow handling in components
    }
  }, [userId, fetchCart]);



  // Remove item from cart
  const removeFromCart = useCallback(async (cartItemId: string) => {
    if (!userId) {
      setError('You must be logged in to remove items from cart');
      return;
    }

    try {
      setError(null);

      // Optimistic update
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));

      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item from cart');
      
      // Revert optimistic update on error
      await fetchCart();
      throw err;
    }
  }, [userId, fetchCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    if (!userId) {
      setError('You must be logged in to update cart');
      return;
    }

    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update quantity');
      }

      // Update local state optimistically
      setCartItems(prev => 
        prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity, updated_at: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
      
      // Revert optimistic update on error
      await fetchCart();
      throw err;
    }
  }, [userId, fetchCart,removeFromCart]);


  // Move item to save for later
  const moveToSaveForLater = useCallback(async (cartItemId: string) => {
    if (!userId) {
      setError('You must be logged in to modify cart');
      return;
    }

    try {
      setError(null);

      // For now, we'll use the addToCart function with item_type = 'save_for_later'
      // First, get the cart item to know the product variant ID
      const cartItem = cartItems.find(item => item.id === cartItemId);
      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Add to save for later
      await addToCart(cartItem.product_variant_id, cartItem.quantity, 'save_for_later');
      
      // Remove from cart
      await removeFromCart(cartItemId);
    } catch (err) {
      console.error('Error moving to save for later:', err);
      setError(err instanceof Error ? err.message : 'Failed to move item to save for later');
      throw err;
    }
  }, [userId, cartItems, addToCart, removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!userId || !cart) {
      return;
    }

    try {
      setError(null);

      // Remove all items one by one
      const deletePromises = cartItems.map(item => 
        fetch(`/api/cart/${item.id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      
      // Refresh cart
      await fetchCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    }
  }, [userId, cart, cartItems, fetchCart]);

  // Utility functions
  const getCartItem = useCallback((productVariantId: string): CartItem | undefined => {
    return cartItems.find(item => 
      item.product_variant_id === productVariantId && item.item_type === 'cart'
    );
  }, [cartItems]);

  const isInCart = useCallback((productVariantId: string): boolean => {
    return cartItems.some(item => 
      item.product_variant_id === productVariantId && item.item_type === 'cart'
    );
  }, [cartItems]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  return {
    // State
    cart,
    cartItems: cartItems.filter(item => item.item_type === 'cart'),
    loading,
    error,
    
    // Cart info
    cartCount,
    cartTotal,
    isLoading: loading,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    moveToSaveForLater,
    clearCart,
    refreshCart,
    
    // Utilities
    getCartItem,
    isInCart,
  };
}

// Additional hook for save for later items
export function useSaveForLater() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const saveForLaterItems = cartItems.filter(item => item.item_type === 'save_for_later');

  const moveSaveForLaterToCart = async (cartItemId: string) => {
    const item = cartItems.find(item => item.id === cartItemId);
    if (!item) return;

    // Add to cart
    await updateQuantity(cartItemId, item.quantity);
  };

  return {
    saveForLaterItems,
    moveToCart: moveSaveForLaterToCart,
    removeFromSaveForLater: removeFromCart,
  };
}