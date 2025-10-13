'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';
import { useCart } from './useCart';
import { usePayment } from './usePayment';

export interface CheckoutData {
    shipping_address_id: string;
    billing_address_id: string;
    payment_method: 'razorpay' | 'cod';
    notes?: string;
}

export interface Order {
    id: string;
    total_amount: number;
    currency: string;
    
}

export interface CheckoutResponse {
    message: string;
    order: Order;
    requires_payment: boolean;
}

interface UseCheckoutReturn {
    // State
    loading: boolean;
    error: string | null;
    checkoutData: CheckoutData | null;
    
    // Actions
    processCheckout: (data: CheckoutData) => Promise<CheckoutResponse>;
    validateCheckoutData: (data: CheckoutData) => { isValid: boolean; errors: string[] };
    resetCheckout: () => void;
}

export const useCheckout = (): UseCheckoutReturn => {
    const { userId } = useAuth();
    const { refreshCart, cartItems } = useCart();
    const { initializeRazorpayPayment, handleCODOrder } = usePayment();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

    // Validate checkout data before submission
    const validateCheckoutData = useCallback((data: CheckoutData): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!data.shipping_address_id) {
        errors.push('Shipping address is required');
        }

        if (!data.billing_address_id) {
        errors.push('Billing address is required');
        }

        if (!data.payment_method) {
        errors.push('Payment method is required');
        }

        if (!['razorpay', 'cod'].includes(data.payment_method)) {
        errors.push('Invalid payment method');
        }

        return {
        isValid: errors.length === 0,
        errors
        };
    }, []);

    // Main checkout process
    const processCheckout = useCallback(async (data: CheckoutData): Promise<CheckoutResponse> => {
        if (!userId) {
        throw new Error('You must be logged in to checkout');
        }

        // Validate data
        const validation = validateCheckoutData(data);
        if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
        }

        // Check if cart has items
        if (cartItems.length === 0) {
        throw new Error('Your cart is empty');
        }

        setLoading(true);
        setError(null);
        setCheckoutData(data);

        try {
        // Create order via API
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to process checkout');
        }

        // Refresh cart to reflect cleared state
        await refreshCart();

        // Handle payment based on method
        if (data.payment_method === 'razorpay' && result.order) {
            // Initialize Razorpay payment
            await initializeRazorpayPayment(
            result.order.id,
            result.order.total_amount,
            result.order.currency
            );
        } else if (data.payment_method === 'cod' && result.order) {
            // Handle COD order
            await handleCODOrder(result.order.id);
        }

        return result;
        } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
        setError(errorMessage);
        throw err;
        } finally {
        setLoading(false);
        }
    }, [userId, cartItems.length, validateCheckoutData, refreshCart, initializeRazorpayPayment, handleCODOrder]);

    // Reset checkout state
    const resetCheckout = useCallback(() => {
        setLoading(false);
        setError(null);
        setCheckoutData(null);
    }, []);

    return {
        loading,
        error,
        checkoutData,
        processCheckout,
        validateCheckoutData,
        resetCheckout,
    };
};