// hooks/useCheckout.ts
'use client';

import { supabase } from '@/lib/client';
import { CartItemWithDetails, CheckoutResponse, CheckoutSummary, Order } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';

export interface CheckoutData {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: 'razorpay' | 'cod';
  notes?: string;
}

interface UseCheckoutReturn {
  // State
  loading: boolean;
  error: string | null;
  checkoutData: CheckoutData | null;
  
  // Actions
  processCheckout: (data: CheckoutData, cartItems?: CartItemWithDetails[]) => Promise<CheckoutResponse>;
  validateCheckoutData: (data: CheckoutData) => { isValid: boolean; errors: string[] };
  resetCheckout: () => void;
  calculateOrderTotals: (items: CartItemWithDetails[]) => CheckoutSummary;
}

export function useCheckout(): UseCheckoutReturn {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  const ensureAuth = useCallback(() => {
    if (!authLoaded) throw new Error('Auth not ready');
    if (!userId) throw new Error('User not authenticated');
  }, [authLoaded, userId]);

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

  const calculateOrderTotals = useCallback((items: CartItemWithDetails[]): CheckoutSummary => {
    if (!items?.length) {
      return {
        subtotal: 0,
        shipping_cost: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        items_count: 0,
      };
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      if (!item.product_variant || !item.product_variant.product) {
        return sum;
      }
      const basePrice = Number(item.product_variant?.product?.base_price ?? 0);
      const priceAdjustment = Number(item.product_variant?.price_adjustment ?? 0);
      const price = basePrice + priceAdjustment;
      return sum + (price * item.quantity);
    }, 0);

    // Calculate shipping
    const shippingCost = subtotal > 500 ? 0 : 50;

    // Calculate tax (18% GST)
    const taxAmount = subtotal * 0.18;

    // No coupon discount for now
    const discountAmount = 0;

    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    return {
      subtotal,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      items_count: items.length,
    };
  }, []);

  const processCheckout = useCallback(async (data: CheckoutData, cartItems?: CartItemWithDetails[]): Promise<CheckoutResponse> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);
      setCheckoutData(data);

      // Validate data
      const validation = validateCheckoutData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Verify addresses exist and belong to user
      const { data: addresses, error: addressError } = await supabase
        .from('addresses')
        .select('id')
        .in('id', [data.shipping_address_id, data.billing_address_id])
        .eq('user_id', userId!)
        .is('deleted_at', null);

      if (addressError) {
        throw new Error(`Address verification failed: ${addressError.message}`);
      }

      if (!addresses || addresses.length < 2) {
        throw new Error('One or more selected addresses are invalid');
      }

      // Calculate order totals if cart items are provided
      const orderTotals = cartItems ? calculateOrderTotals(cartItems) : {
        subtotal: 0,
        shipping_cost: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        items_count: 0,
      };

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order with calculated amounts
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          shipping_address_id: data.shipping_address_id,
          billing_address_id: data.billing_address_id,
          subtotal: orderTotals.subtotal,
          shipping_cost: orderTotals.shipping_cost,
          tax_amount: orderTotals.tax_amount,
          discount_amount: orderTotals.discount_amount,
          total_amount: orderTotals.total_amount,
          currency: 'INR',
          amount_paid: 0,
          is_paid: false,
          payment_status: data.payment_method === 'cod' ? 'cod_pending' : 'pending',
          payment_provider: null,
          transaction_id: null,
          payment_summary: {},
          payment_expires_at: null,
          payment_method: data.payment_method,
          order_status: 'pending',
          notes: data.notes,
          acknowledged: false,
          acknowledged_at: null,
          acknowledged_by: null,
          updated_by: null,
          version: 1,
          ip_address: null,
          user_agent: null,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(`Order creation failed: ${orderError?.message || 'Unknown error'}`);
      }

      // Create order items if cart items are provided
      if (cartItems && cartItems.length > 0) {
        const orderItems = cartItems.map(item => {
          const variant = item.product_variant;
          const product = variant?.product;
          
          if (!variant || !product) {
            throw new Error('Invalid cart item data');
          }

          const basePrice = product.base_price || 0;
          const priceAdjustment = variant.price_adjustment || 0;
          const priceAtPurchase = basePrice + priceAdjustment;

          return {
            order_id: order.id,
            product_variant_id: item.product_variant_id,
            product_name: product.name,
            variant_sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price_at_purchase: priceAtPurchase,
            quantity: item.quantity,
            subtotal: priceAtPurchase * item.quantity,
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          // Rollback order if items creation fails
          await supabase.from('orders').delete().eq('id', order.id);
          throw new Error(`Failed to create order items: ${itemsError.message}`);
        }
      }

      // Create initial status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Order created',
          changed_by: userId,
        });

      // Create full order object that matches the Order type
      const fullOrder: Order = {
        id: order.id,
        order_number: order.order_number,
        user_id: order.user_id,
        shipping_address_id: order.shipping_address_id,
        billing_address_id: order.billing_address_id,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        currency: order.currency,
        amount_paid: order.amount_paid,
        is_paid: order.is_paid,
        payment_status: order.payment_status,
        payment_provider: order.payment_provider,
        transaction_id: order.transaction_id,
        payment_summary: order.payment_summary,
        payment_expires_at: order.payment_expires_at,
        payment_method: order.payment_method,
        order_status: order.order_status,
        notes: order.notes,
        acknowledged: order.acknowledged,
        acknowledged_at: order.acknowledged_at,
        acknowledged_by: order.acknowledged_by,
        created_at: order.created_at,
        updated_at: order.updated_at,
        updated_by: order.updated_by,
        version: order.version,
        ip_address: order.ip_address,
        user_agent: order.user_agent,
      };

      const response: CheckoutResponse = {
        message: 'Order created successfully',
        order: fullOrder,
        requires_payment: data.payment_method === 'razorpay',
      };

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, validateCheckoutData, calculateOrderTotals, userId]);

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
    calculateOrderTotals,
  };
}