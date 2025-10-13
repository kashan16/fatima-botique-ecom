'use client';

import { useUserAssets } from "@/hooks/useUserAssets";
import { createContext, useContext } from "react";

interface UserAssets {
  cart_id: string;
  wishlist_id: string;
  user_id: string;
  timestamp: string;
}

interface UserAssetsContextType {
  assets: UserAssets | null;
  cartId: string | null;
  wishlistId: string | null;
  hasAssets: boolean;
  isLoading: boolean;
  isAuthLoaded: boolean;
  isInitialized: boolean;
  error: Error | null;
  initializeAssets: () => Promise<UserAssets | null>;
  mergeGuestCart: () => Promise<boolean>;
  refetch: () => Promise<UserAssets | null>;
}

const UserAssetsContext = createContext<UserAssetsContextType | undefined>(undefined);

export function UserAssetsProvider({ children }: { children: React.ReactNode }) {
  const userAssets = useUserAssets();

  return (
    <UserAssetsContext.Provider value={userAssets}>
      {children}
    </UserAssetsContext.Provider>
  );
}

export function useUserAssetsContext() {
  const context = useContext(UserAssetsContext);
  if (context === undefined) {
    throw new Error('useUserAssetsContext must be used within a UserAssetsProvider');
  }
  return context;
}

// Export both for convenience
export { useUserAssets };
