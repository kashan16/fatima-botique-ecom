'use client';

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useRef, useState } from "react";

interface UserAssets {
    cart_id : string;
    wishlist_id : string;
    user_id : string;
    timestamp : string;
}

interface UserDataContextType {
    assets : UserAssets | null;
    isLoading : boolean;
    error : Error | null;
    isInitialized : boolean;
    refetch : () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);
const initializationState = new Map<string, Promise<UserAssets>>();

export function UserDataProvider({ children } : { children : React.ReactNode }) {
    const { userId, isLoaded: authLoaded } = useAuth();
    const [ isInitialized, setIsInitialized ] = useState(false);
    const initializationRef = useRef<string | null>(null);
    const queryClient = useQueryClient();

    const assetsQuery = useQuery({
        queryKey : ['user-assets', userId],
        queryFn : async () : Promise<UserAssets> => {
            if(!userId) throw new Error('User not authenticated');

            const existingInit = initializationState.get(userId);
            if(existingInit) {
                return existingInit;
            }

            const initPromise = fetch('/api/user/initialize-assets', {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json',
                },
                body : JSON.stringify({ user_id : userId }),
            }).then(async (response) => {
                if(!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to initialize user assets');
                }
                return response.json();
            });
            initializationState.set(userId, initPromise);

            try {
                const results = await initPromise;
                return results;
            } finally {
                setTimeout(() => initializationState.delete(userId), 1000);
            }
        },
        enabled : !!userId && authLoaded,
        retry : (failureCount, error) => {
            if(error.message?.includes('User not authenticated')) return false;
            return failureCount < 3;
        },
        staleTime : 24 * 60 * 60 * 1000,
        gcTime : 24 * 60 * 60 * 1000,
    });

    useEffect(() => {
        if(assetsQuery.data && !isInitialized) {
            const mergeGuestCart = async () => {
                try {
                    const guestCart = localStorage.getItem('guest_cart');
                    if(guestCart) {
                        const guestItems = JSON.parse(guestCart);
                        if(guestItems.length > 0) {
                            await fetch('api/cart/merge-guest', {
                                method : 'POST',
                                headers : {
                                    'Content-Type' : 'application/json',
                                },
                                body : JSON.stringify({
                                    user_id : userId,
                                    guest_items : guestItems,
                                }),
                            });
                            localStorage.removeItem('guest_cart');
                            console.log(`Merged ${guestItems.length} guest items into user cart`);
                        }
                    }
                } catch(error) {
                    console.error('Failed to merge guest cart : ', error);
                } finally {
                    setIsInitialized(true);
                }
            };
            mergeGuestCart();
        }
    }, [assetsQuery.data, userId, isInitialized]);

    useEffect(() => {
        if(!userId) {
            setIsInitialized(false);
            initializationRef.current = null
        }
    }, [userId]);

    const value : UserDataContextType = {
        assets : assetsQuery.data || null,
        isLoading : assetsQuery.isLoading,
        error : assetsQuery.error,
        isInitialized,
        refetch : async () => {
            await queryClient.invalidateQueries({ queryKey : ['user-assets', userId]});
        }
    };

    return (
        <UserDataContext.Provider value = {value}>
            {children}
        </UserDataContext.Provider>
    )
}

export function useUserData() {
    const context = useContext(UserDataContext);
    if(context === undefined) {
        throw new Error('useUserData must be used within a UserDataProdiver');
    }
    return context;
}