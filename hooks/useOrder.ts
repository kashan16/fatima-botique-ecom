// hooks/useOrder.ts
'use client';

import { supabase } from '@/lib/client';
import type {
  CheckoutSummary,
  CreateOrderInput,
  Order,
  OrderFilters,
  OrderStatus,
  OrderStatusHistoryItem,
  OrderWithDetails,
} from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';
import { useCart } from './useCart';

export function useOrder() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureAuth = useCallback(() => {
    if (!authLoaded) throw new Error('Auth not ready');
    if (!userId) throw new Error('User not authenticated');
  }, [authLoaded, userId]);

  const calculateSummary = useCallback(async (): Promise<CheckoutSummary> => {
    const subtotal = Number(cartTotal ?? 0);
    const shipping_cost = subtotal > 500 ? 0 : 50;
    const tax_amount = subtotal * 0.18;
    const discount_amount = 0;
    const total_amount = subtotal + shipping_cost + tax_amount - discount_amount;

    return {
      subtotal,
      shipping_cost,
      tax_amount,
      discount_amount,
      total_amount,
      items_count: cartCount ?? 0,
    };
  }, [cartTotal, cartCount]);

  const fetchOrders = useCallback(async (filters?: OrderFilters) => {
    ensureAuth();
    try {
      setLoading(true);
      setError(null);

      let q = supabase
        .from('orders')
        .select(`
          *,
          shipping_address:addresses!orders_shipping_address_id_fkey(*),
          billing_address:addresses!orders_billing_address_id_fkey(*),
          order_items(*, product_variant:product_variants(*, product:products(*))),
          order_payments(*),
          order_status_history(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) q = q.eq('order_status', filters.status);
      if (filters?.payment_status) q = q.eq('payment_status', filters.payment_status);
      if (filters?.date_from) q = q.gte('created_at', filters.date_from);
      if (filters?.date_to) q = q.lte('created_at', filters.date_to);

      const { data, error: fetchError } = await q;
      if (fetchError) throw fetchError;

      setOrders((data || []) as OrderWithDetails[]);
      return (data || []) as OrderWithDetails[];
    } catch (err) {
      console.error('fetchOrders error', err);
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId]);

  // Fetch a single order by id with full details (returns null if not found / unauthorized)
  const fetchOrderById = useCallback(async (orderId: string): Promise<OrderWithDetails | null> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          shipping_address:addresses!orders_shipping_address_id_fkey(*),
          billing_address:addresses!orders_billing_address_id_fkey(*),
          order_items(*, product_variant:product_variants(*, product:products(*))),
          order_payments(*),
          order_status_history(*)
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.warn('fetchOrderById supabase error:', fetchError);
        return null;
      }

      if (!data) return null;

      return data as unknown as OrderWithDetails;
    } catch (err) {
      console.error('fetchOrderById error', err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId]);

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<Order | null> => {
    ensureAuth();
    try {
      setLoading(true);
      setError(null);

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const summary = await calculateSummary();

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          shipping_address_id: input.shipping_address_id,
          billing_address_id: input.billing_address_id,
          subtotal: summary.subtotal,
          shipping_cost: summary.shipping_cost,
          tax_amount: summary.tax_amount,
          discount_amount: summary.discount_amount,
          total_amount: summary.total_amount,
          currency: 'INR',
          payment_method: input.payment_method,
          payment_status: input.payment_method === 'cod' ? 'cod_pending' : 'pending',
          order_status: 'pending',
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order insert failed', orderError);
        throw orderError ?? new Error('Order creation failed');
      }

      // build order_items payload from cartItems
      const orderItemsPayload = cartItems.map(ci => {
        const variant = ci.product_variant!;
        const product = variant.product!;
        const price_at_purchase = Number(product.base_price ?? 0) + Number(variant.price_adjustment ?? 0);
        return {
          order_id: order.id,
          product_variant_id: variant.id,
          product_name: product.name,
          variant_sku: variant.sku,
          size: variant.size,
          color: variant.color,
          price_at_purchase,
          quantity: ci.quantity,
          subtotal: price_at_purchase * ci.quantity,
        };
      });

      if (orderItemsPayload.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
        if (itemsError) {
          // rollback
          await supabase.from('orders').delete().eq('id', order.id);
          throw itemsError;
        }
      }

      // create initial status
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'pending',
        notes: 'Order created',
        changed_by: userId,
      });

      // clear cart if you have clearCart implementation
      try {
        await clearCart();
      } catch (e) {
        console.error('clearCart error', e);
      }

      // refresh orders list
      void fetchOrders();

      return order as Order;
    } catch (err) {
      console.error('createOrder error', err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId, cartItems, calculateSummary, fetchOrders, clearCart]);

  // ---------------------------
  // cancelOrder implementation
  // ---------------------------
  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<void> => {
    ensureAuth();
    try {
      setLoading(true);
      setError(null);

      // fetch minimal order to check status & ownership
      const { data: orderRow, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_status, payment_status, user_id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }
      if (!orderRow) {
        throw new Error('Order not found');
      }

      const currentStatus = orderRow.order_status as OrderStatus;

      const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing'];
      if (!cancellableStatuses.includes(currentStatus)) {
        throw new Error(`Order cannot be cancelled from status: ${currentStatus}`);
      }

      // update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', orderId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // insert into status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'cancelled',
          notes: reason ?? 'Cancelled by user',
          changed_by: userId,
        });

      if (historyError) {
        console.error('Failed to write order_status_history for cancel:', historyError);
      }

      // optimistic local update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'cancelled' } : o));

      // NOTE: if payment was already completed, create refund workflow (out-of-scope here).
      return;
    } catch (err) {
      console.error('cancelOrder error', err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId]);

  // ---------------------------
  // returnOrder implementation
  // ---------------------------
  const returnOrder = useCallback(async (orderId: string, reason: string): Promise<void> => {
    ensureAuth();
    try {
      setLoading(true);
      setError(null);

      // fetch order and status history to determine delivered date / ownership
      const { data: orderRow, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_status, total_amount, user_id, updated_at')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }
      if (!orderRow) {
        throw new Error('Order not found');
      }

      if (orderRow.order_status !== 'delivered') {
        throw new Error('Only delivered orders can be returned');
      }

      // determine delivered date - prefer order_status_history record with 'delivered' status
      const { data: historyRows, error: historyFetchError } = await supabase
        .from('order_status_history')
        .select('created_at, status')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (historyFetchError) {
        console.warn('Could not fetch order_status_history to compute delivered date:', historyFetchError);
      }

      let deliveredAt: Date | null = null;
      if (historyRows && Array.isArray(historyRows)) {
        const deliveredRecord = (historyRows as OrderStatusHistoryItem[]).reverse().find(h => h.status === 'delivered');
        if (deliveredRecord && deliveredRecord.created_at) {
          deliveredAt = new Date(deliveredRecord.created_at);
        }
      }

      // fallback to orders.updated_at if no history delivered timestamp
      if (!deliveredAt && orderRow.updated_at) {
        deliveredAt = new Date(orderRow.updated_at);
      }

      if (!deliveredAt) {
        throw new Error('Cannot determine delivery date for return window calculation');
      }

      const now = new Date();
      const daysSinceDelivery = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
      const returnWindowDays = 7;
      if (daysSinceDelivery > returnWindowDays) {
        throw new Error(`Return window of ${returnWindowDays} days has expired`);
      }

      // update order status to 'returned'
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          order_status: 'returned',
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', orderId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // insert status history
      const { error: historyInsertError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'returned',
          notes: `Return requested: ${reason}`,
          changed_by: userId,
        });
      if (historyInsertError) {
        console.error('Failed to write order_status_history for return:', historyInsertError);
      }

      // optimistic local update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'returned' } : o));

      // NOTE: refund handling (if payment was captured) should be performed by a backend job/admin process.
      return;
    } catch (err) {
      console.error('returnOrder error', err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId]);

  // ---------------------------
  // trackOrder implementation
  // ---------------------------
  const trackOrder = useCallback(async (orderId: string): Promise<{
    order: OrderWithDetails | null;
    statusHistory: OrderStatusHistoryItem[];
    currentStatus?: OrderStatus;
    estimatedDelivery: string;
  }> => {
    ensureAuth();
    try {
      setLoading(true);
      setError(null);

      // fetch order with relations using existing function (ownership enforced)
      const order = await fetchOrderById(orderId);
      if (!order) {
        return {
          order: null,
          statusHistory: [],
          currentStatus: undefined,
          estimatedDelivery: 'Not available',
        };
      }

      // fetch status history (always fetch fresh)
      const { data: statusHistoryData, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.warn('trackOrder: failed to fetch status history', historyError);
      }

      const statusHistory = (statusHistoryData || []) as OrderStatusHistoryItem[];

      const currentStatus = order.order_status as OrderStatus | undefined;

      // estimated delivery:
      // - If there is a 'shipped' record, add 3 days
      // - else use created_at + 7 days
      let estimatedDelivery = 'Not available';
      const shippedRecord = statusHistory.slice().reverse().find(s => s.status === 'shipped');
      if (shippedRecord && shippedRecord.created_at) {
        const shippedAt = new Date(shippedRecord.created_at);
        const est = new Date(shippedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
        estimatedDelivery = est.toLocaleDateString();
      } else if (order.created_at) {
        const created = new Date(order.created_at);
        const est = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
        estimatedDelivery = est.toLocaleDateString();
      }

      return {
        order,
        statusHistory,
        currentStatus,
        estimatedDelivery,
      };
    } catch (err) {
      console.error('trackOrder error', err);
      setError(err instanceof Error ? err.message : String(err));
      return {
        order: null,
        statusHistory: [],
        currentStatus: undefined,
        estimatedDelivery: 'Not available',
      };
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, fetchOrderById]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    createOrder,
    calculateSummary,
    cancelOrder,
    returnOrder,
    trackOrder,
    refetch: fetchOrders,
  };
}
