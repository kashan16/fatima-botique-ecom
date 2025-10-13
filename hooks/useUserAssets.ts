import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

interface UserAssets {
  cart_id: string;
  wishlist_id: string;
  user_id: string;
  timestamp: string;
}

const initializationCache = new Map<string, Promise<UserAssets>>();

export function useUserAssets() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [assets, setAssets] = useState<UserAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initializationRef = useRef<string | null>(null);
  const hasMergedGuestCart = useRef(false);

  // Initialize user assets
  const initializeAssets = useCallback(async (): Promise<UserAssets | null> => {
    if (!userId) {
      setError(new Error('User not authenticated'));
      return null;
    }

    // Prevent duplicate initialization
    if (initializationRef.current === userId && assets) {
      return assets;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if initialization is already in progress
      const existingInit = initializationCache.get(userId);
      if (existingInit) {
        const result = await existingInit;
        setAssets(result);
        initializationRef.current = userId;
        return result;
      }

      // Create new initialization promise
      const initPromise = fetch('/api/user/initialize-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to initialize user assets');
        }
        return response.json();
      });

      initializationCache.set(userId, initPromise);

      try {
        const result = await initPromise;
        setAssets(result);
        initializationRef.current = userId;
        return result;
      } finally {
        // Clean up cache after a short delay
        setTimeout(() => initializationCache.delete(userId), 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to initialize user assets');
      setError(errorMessage);
      console.error('Error initializing user assets:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, assets]);

  // Merge guest cart into user cart
  const mergeGuestCart = useCallback(async (): Promise<boolean> => {
    if (!userId || !assets || hasMergedGuestCart.current) {
      return false;
    }

    try {
      const guestCartData = localStorage.getItem('guest_cart');
      if (!guestCartData) {
        return false;
      }

      const guestItems = JSON.parse(guestCartData);
      if (!Array.isArray(guestItems) || guestItems.length === 0) {
        localStorage.removeItem('guest_cart');
        return false;
      }

      const response = await fetch('/api/cart/merge-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          guest_items: guestItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge guest cart');
      }

      localStorage.removeItem('guest_cart');
      hasMergedGuestCart.current = true;
      console.log(`Merged ${guestItems.length} guest items into user cart`);
      
      return true;
    } catch (err) {
      console.error('Failed to merge guest cart:', err);
      return false;
    }
  }, [userId, assets]);

  // Refetch assets
  const refetch = useCallback(async (): Promise<UserAssets | null> => {
    if (!userId) return null;
    
    // Clear current state to force re-initialization
    initializationRef.current = null;
    setAssets(null);
    
    return initializeAssets();
  }, [userId, initializeAssets]);

  // Auto-initialize when user loads
  useEffect(() => {
    if (isAuthLoaded && userId && !assets && initializationRef.current !== userId) {
      initializeAssets();
    } else if (isAuthLoaded && !userId) {
      // Reset state when user logs out
      setAssets(null);
      setIsInitialized(false);
      setError(null);
      initializationRef.current = null;
      hasMergedGuestCart.current = false;
    }
  }, [isAuthLoaded, userId, assets, initializeAssets]);

  // Merge guest cart after assets are initialized
  useEffect(() => {
    if (assets && !isInitialized && !hasMergedGuestCart.current) {
      mergeGuestCart().finally(() => {
        setIsInitialized(true);
      });
    }
  }, [assets, isInitialized, mergeGuestCart]);

  // Computed values
  const hasAssets = !!assets;
  const cartId = assets?.cart_id || null;
  const wishlistId = assets?.wishlist_id || null;

  return {
    // Data
    assets,
    cartId,
    wishlistId,
    hasAssets,
    
    // Loading states
    isLoading,
    isAuthLoaded,
    isInitialized,
    
    // Error
    error,
    
    // Methods
    initializeAssets,
    mergeGuestCart,
    refetch,
  };
}