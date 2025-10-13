'use client';

import { ProductVariantWithImages } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

// Types (we can import these from useCart or define here)
export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_variant_id: string;
  added_at: string;
  updated_at: string;
  product_variant?: ProductVariantWithImages; // We can refine this type later
}

export interface Wishlist {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface WishlistResponse {
  wishlist: Wishlist | null;
  wishlistItems: WishlistItem[];
}

interface UseWishlistReturn {
  // State
  wishlist: Wishlist | null;
  wishlistItems: WishlistItem[];
  loading: boolean;
  error: string | null;
  
  // Wishlist info
  wishlistCount: number;
  isLoading: boolean;
  
  // Actions
  addToWishlist: (productVariantId: string) => Promise<void>;
  removeFromWishlist: (wishlistItemId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  
  // Utilities
  isInWishlist: (productVariantId: string) => boolean;
  getWishlistItem: (productVariantId: string) => WishlistItem | undefined;
}

export function useWishlist(): UseWishlistReturn {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived values
  const wishlistCount = wishlistItems.length;

  // Fetch wishlist data
  const fetchWishlist = useCallback(async () => {
    if (!userId || !authLoaded) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wishlist');
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data: WishlistResponse = await response.json();
      setWishlist(data.wishlist);
      setWishlistItems(data.wishlistItems || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  }, [userId, authLoaded]);

  // Initial wishlist load
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Add item to wishlist
  const addToWishlist = useCallback(async (productVariantId: string) => {
    if (!userId) {
      setError('You must be logged in to add items to wishlist');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_variant_id: productVariantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to wishlist');
      }

      // Refresh wishlist to get updated data
      await fetchWishlist();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item to wishlist');
      throw err; // Re-throw to allow handling in components
    }
  }, [userId, fetchWishlist]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (wishlistItemId: string) => {
    if (!userId) {
      setError('You must be logged in to remove items from wishlist');
      return;
    }

    try {
      setError(null);

      // Optimistic update
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));

      const response = await fetch(`/api/wishlist/${wishlistItemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item from wishlist');
      
      // Revert optimistic update on error
      await fetchWishlist();
      throw err;
    }
  }, [userId, fetchWishlist]);

  // Utility functions
  const isInWishlist = useCallback((productVariantId: string): boolean => {
    return wishlistItems.some(item => item.product_variant_id === productVariantId);
  }, [wishlistItems]);

  const getWishlistItem = useCallback((productVariantId: string): WishlistItem | undefined => {
    return wishlistItems.find(item => item.product_variant_id === productVariantId);
  }, [wishlistItems]);

  const refreshWishlist = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  return {
    // State
    wishlist,
    wishlistItems,
    loading,
    error,
    
    // Wishlist info
    wishlistCount,
    isLoading: loading,
    
    // Actions
    addToWishlist,
    removeFromWishlist,
    refreshWishlist,
    
    // Utilities
    isInWishlist,
    getWishlistItem,
  };
}