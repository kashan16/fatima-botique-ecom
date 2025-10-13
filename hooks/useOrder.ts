import {
  ApiResponse,
  CheckoutSummary,
  CreateOrderInput,
  Order,
  OrderFilters,
  OrderStatus,
  OrderStatusHistoryItem,
  OrderSummary,
  OrderWithDetails,
  PaginatedResponse
} from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';
import { useCart } from './useCart';

// Extended interface for order details from API
interface OrderDetails extends OrderWithDetails {
  status_history: OrderStatusHistoryItem[];
  can_cancel: boolean;
  can_return: boolean;
  return_window_days: number;
}

interface UseOrderReturn {
  // State
  orders: OrderWithDetails[];
  loading: boolean;
  error: string | null;
  
  // Order Management
  fetchOrders: (filters?: OrderFilters) => Promise<OrderWithDetails[]>;
  fetchOrderById: (orderId: string) => Promise<OrderWithDetails | null>;
  createOrder: (orderData: CreateOrderInput) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  returnOrder: (orderId: string, reason: string) => Promise<void>;
  
  // Order Tracking
  getOrderStatusHistory: (orderId: string) => Promise<OrderStatusHistoryItem[]>;
  trackOrder: (orderId: string) => Promise<{
    order: OrderWithDetails | null;
    statusHistory: OrderStatusHistoryItem[];
    currentStatus: OrderStatus | undefined;
    estimatedDelivery: string;
  }>;
  
  // Utilities
  calculateCheckoutSummary: () => Promise<CheckoutSummary>;
  refetch: () => Promise<OrderWithDetails[]>;
}

export const useOrder = (): UseOrderReturn => {
  const { userId } = useAuth();
  const { cartItems, cartTotal, cartCount, refreshCart, clearCart } = useCart();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Fetch order by ID with full details
  const fetchOrderById = useCallback(async (orderId: string): Promise<OrderWithDetails | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/account/order/${orderId}`);
      const result: ApiResponse<OrderDetails> = await response.json(); // FIX: Use OrderDetails type

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch order details');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
      setError(errorMessage);
      console.error('Error fetching order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user orders with filters
  const fetchOrders = useCallback(async (filters?: OrderFilters): Promise<OrderWithDetails[]> => {
    if (!userId) {
      setError('User not authenticated');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.payment_status) queryParams.append('payment_status', filters.payment_status);
      if (filters?.date_from) queryParams.append('date_from', filters.date_from);
      if (filters?.date_to) queryParams.append('date_to', filters.date_to);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/account/order?${queryParams.toString()}`);
      const result: ApiResponse<PaginatedResponse<OrderSummary>> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch orders');
      }

      // For now, we'll use the summary data and fetch details for each order
      // In a real app, you might want to adjust the API to return full details
      const orderDetails = await Promise.all(
        result.data.data.map(order => fetchOrderById(order.id))
      );

      const validOrders = orderDetails.filter((order): order is OrderWithDetails => order !== null);
      setOrders(validOrders);
      return validOrders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, fetchOrderById]); // FIX: Added fetchOrderById dependency

  // Calculate checkout summary
  const calculateCheckoutSummary = useCallback(async (): Promise<CheckoutSummary> => {
    // FIX: Use cart state directly instead of fetchCart
    if (!cartItems || cartItems.length === 0) {
      return {
        subtotal: 0,
        shipping_cost: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        items_count: 0,
      };
    }

    const subtotal = cartTotal;
    const shippingCost = subtotal > 500 ? 0 : 50;
    const taxAmount = subtotal * 0.18;
    const discountAmount = 0;
    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    return {
      subtotal,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      items_count: cartCount,
    };
  }, [cartItems, cartTotal, cartCount]); // FIX: Use cart state dependencies

  // Create order from cart
  const createOrder = useCallback(async (orderData: CreateOrderInput): Promise<Order> => { // FIX: Added return type
    if (!userId) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      // FIX: Use cart state directly instead of fetchCart
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Use the checkout API instead of direct order creation
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Clear cart after successful order creation
      await clearCart();

      return result.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      console.error('Error creating order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, cartItems, clearCart]); // FIX: Updated dependencies

  // Get order status history
  const getOrderStatusHistory = useCallback(async (orderId: string): Promise<OrderStatusHistoryItem[]> => { // FIX: Added return type
    if (!userId) {
      setError('User not authenticated');
      return [];
    }

    try {
      const order = await fetchOrderById(orderId);
      return order?.status_history || []; // FIX: Now properly typed
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status history';
      setError(errorMessage);
      console.error('Error fetching status history:', err);
      return [];
    }
  }, [userId, fetchOrderById]);

  // Cancel order (if allowed)
  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/account/order/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Order cancelled by user' }),
      });

      const result: ApiResponse<{ message: string }> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel order');
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, order_status: 'cancelled' }
          : order
      ));

      await fetchOrders(); // Refresh orders list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(errorMessage);
      console.error('Error cancelling order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, fetchOrders]);

  // Track order
  const trackOrder = useCallback(async (orderId: string) => {
    const order = await fetchOrderById(orderId);
    const statusHistory = await getOrderStatusHistory(orderId);
    
    return {
      order,
      statusHistory,
      currentStatus: order?.order_status,
      estimatedDelivery: calculateEstimatedDelivery(order?.created_at),
    };
  }, [fetchOrderById, getOrderStatusHistory]);

  // Return order (if applicable)
  const returnOrder = useCallback(async (orderId: string, reason: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      // For a full implementation, you'd need to specify which items to return
      // For now, we'll return all items
      const order = await fetchOrderById(orderId);
      const returnItems = order?.order_items.map(item => ({
        order_item_id: item.id,
        quantity: item.quantity
      })) || [];

      const response = await fetch(`/api/account/order/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: returnItems, 
          reason 
        }),
      });

      const result: ApiResponse<{ message: string; return_id?: string }> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process return');
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, order_status: 'returned' }
          : order
      ));

      await fetchOrders(); // Refresh orders list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process return';
      setError(errorMessage);
      console.error('Error processing return:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, fetchOrderById, fetchOrders]);

  // Helper function to calculate estimated delivery
  const calculateEstimatedDelivery = (orderDate?: string): string => {
    if (!orderDate) return 'Not available';
    
    const order = new Date(orderDate);
    const estimated = new Date(order.getTime() + 7 * 24 * 60 * 60 * 1000);
    return estimated.toLocaleDateString();
  };

  const refetch = useCallback(async (): Promise<OrderWithDetails[]> => {
    return await fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    createOrder,
    getOrderStatusHistory,
    cancelOrder,
    trackOrder,
    returnOrder,
    calculateCheckoutSummary,
    refetch,
  };
};