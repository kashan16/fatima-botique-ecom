'use client';
import { useOrder } from '@/hooks/useOrder';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { OrderWithDetails, PaymentStatus } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ShadCN Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Loader2,
  Lock,
  Package,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Helper functions
const getPaymentStatusVariant = (status: PaymentStatus) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    completed: "default",
    failed: "destructive",
    refunded: "secondary",
    cod_pending: "outline",
  };
  return variants[status] || "outline";
};

const formatPaymentStatusLabel = (status?: string) => {
  switch (status) {
    case 'pending': return { title: 'Pending', description: 'Payment is being processed' };
    case 'completed': return { title: 'Paid', description: 'Payment completed successfully' };
    case 'failed': return { title: 'Failed', description: 'Payment failed' };
    case 'refunded': return { title: 'Refunded', description: 'Payment has been refunded' };
    case 'cod_pending': return { title: 'Cash on Delivery', description: 'Pay when delivered' };
    default: return { title: status || 'Unknown', description: 'Payment status unknown' };
  }
};

const formatOrderStatusLabel = (status?: string) => {
  switch (status) {
    case 'pending': return { title: 'Pending', description: 'Your order is being processed' };
    case 'confirmed': return { title: 'Confirmed', description: 'Order has been confirmed' };
    case 'processing': return { title: 'Processing', description: 'Preparing your order' };
    case 'shipped': return { title: 'Shipped', description: 'Your order is on the way' };
    case 'delivered': return { title: 'Delivered', description: 'Order has been delivered' };
    case 'cancelled': return { title: 'Cancelled', description: 'Order was cancelled' };
    case 'returned': return { title: 'Returned', description: 'Order has been returned' };
    default: return { title: status || 'Unknown', description: 'Order status unknown' };
  }
};

export const OrdersPage = () => {
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Listing hook (pagination)
  const {
    orders,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
  } = useOrderHistory();

  // Actions hook
  const {
    cancelOrder,
    returnOrder,
    trackOrder,
  } = useOrder();

  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);

  const setOrderUpdating = (orderId: string, isUpdating: boolean) => {
    setUpdatingOrders(prev => {
      const s = new Set(prev);
      if (isUpdating) s.add(orderId);
      else s.delete(orderId);
      return s;
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    const ok = confirm('Are you sure you want to cancel this order?');
    if (!ok) return;

    setOrderUpdating(orderId, true);
    try {
      await cancelOrder(orderId, 'Cancelled by user');
      toast.success('Order cancelled successfully');
      await refresh();
    } catch (err) {
      console.error('cancelOrder failed', err);
      toast.error((err instanceof Error && err.message) ? err.message : 'Failed to cancel order');
    } finally {
      setOrderUpdating(orderId, false);
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    const reason = prompt('Please enter a short reason for return (required):', 'Product not as expected');
    if (!reason) {
      toast.error('Return reason is required');
      return;
    }

    setOrderUpdating(orderId, true);
    try {
      await returnOrder(orderId, reason);
      toast.success('Return request submitted');
      await refresh();
    } catch (err) {
      console.error('returnOrder failed', err);
      toast.error((err instanceof Error && err.message) ? err.message : 'Failed to submit return');
    } finally {
      setOrderUpdating(orderId, false);
    }
  };

  const handleTrackOrder = async (orderId: string) => {
    setOrderUpdating(orderId, true);
    try {
      const info = await trackOrder(orderId);
      if (!info.order) {
        toast.error('Order not found');
        return;
      }
      toast.info(`Status: ${info.currentStatus ?? 'Unknown'}. Est. delivery: ${info.estimatedDelivery}`);
    } catch (err) {
      console.error('trackOrder failed', err);
      toast.error((err instanceof Error && err.message) ? err.message : 'Failed to fetch tracking info');
    } finally {
      setOrderUpdating(orderId, false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await loadMore();
    } catch (err) {
      console.error('loadMore failed', err);
      toast.error('Failed to load more orders');
    } finally {
      setLoadingMore(false);
    }
  };

  // Loading State
  if (loading && orders.length === 0) {
    return <OrdersLoadingSkeleton />;
  }

  // Authentication State
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <Card className="max-w-md w-full text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-gray-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Sign In Required</h2>
            <p className="text-gray-700 mb-6">Please sign in to view your order history.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/sign-in')} className="gap-2 bg-gray-900 hover:bg-gray-700">
                Sign In <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="gap-2 border-gray-300">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen py-12 relative">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">Error Loading Orders</h2>
              <p className="text-gray-700 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => refresh()} className="gap-2 bg-gray-900 hover:bg-gray-700">
                  <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push('/')} className="border-gray-300">Go Shopping</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty State
  if (orders.length === 0) {
    return (
      <div className="min-h-screen py-12 relative">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="w-24 h-24 bg-gray-100/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-500" />
              </div>
              <h1 className="text-3xl font-semibold text-gray-800 mb-4">No Orders Yet</h1>
              <p className="text-gray-700 mb-8 text-lg">Your order history will appear here once you start shopping.</p>
              <Link href="/">
                <Button size="lg" className="gap-2 bg-gray-900 hover:bg-gray-700">
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 relative">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">Order History</h1>
            <p className="text-gray-700">Manage and track your orders</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-2 bg-gray-100/80 backdrop-blur-sm text-gray-800">
              {total !== null ? `${orders.length} of ${total}` : `${orders.length}`} orders
            </Badge>
            <Button onClick={() => refresh()} variant="outline" className="gap-2 border-gray-300">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onCancel={handleCancelOrder}
              onReturn={handleReturnOrder}
              onTrack={handleTrackOrder}
              isUpdating={updatingOrders.has(order.id)}
            />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <Button 
              onClick={handleLoadMore} 
              disabled={loadingMore} 
              variant="outline" 
              className="px-8 gap-2 border-gray-300"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Orders'
              )}
            </Button>
          </div>
        )}

        {total !== null && (
          <div className="text-center mt-6 text-gray-700 text-sm">
            Showing {orders.length} of {total} orders
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton Component
function OrdersLoadingSkeleton() {
  return (
    <div className="min-h-screen py-8 relative">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-xl border shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                    
                    <div className="space-y-3">
                      {[...Array(2)].map((_, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j}>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-56 space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-9 w-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ 
  order, 
  onCancel, 
  onReturn, 
  onTrack, 
  isUpdating 
}: { 
  order: OrderWithDetails;
  onCancel: (orderId: string) => void;
  onReturn: (orderId: string) => void;
  onTrack: (orderId: string) => void;
  isUpdating: boolean;
}) {
  const canCancel = ['pending', 'confirmed'].includes(order.order_status);
  const canReturn = order.order_status === 'delivered';
  const canTrack = ['confirmed', 'processing', 'shipped'].includes(order.order_status);

  const paymentStatusLabel = formatPaymentStatusLabel(order.payment_status);
  const orderStatusLabel = formatOrderStatusLabel(order.order_status);

  return (
    <Card className="rounded-xl border shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Order Info */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-gray-800 text-lg">Order #{order.order_number}</h3>
                  <Badge variant={getPaymentStatusVariant(order.payment_status)} className="text-sm">
                    {paymentStatusLabel.title}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{orderStatusLabel.description}</p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="space-y-3">
              {order.order_items.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">{item.product_name}</p>
                    <p className="text-gray-700 text-xs">
                      {item.size} • {item.color} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-gray-800">
                      ₹{(Number(item.price_at_purchase) * Number(item.quantity)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {order.order_items.length > 2 && (
                <p className="text-sm text-gray-700">+{order.order_items.length - 2} more items</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-2">
              <div>
                <p className="text-gray-700">Items Total</p>
                <p className="font-semibold text-gray-800">₹{Number(order.subtotal).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-700">Shipping</p>
                <p className="font-semibold text-gray-800">
                  {order.shipping_cost === 0 ? 'FREE' : `₹${Number(order.shipping_cost).toFixed(2)}`}
                </p>
              </div>
              <div>
                <p className="text-gray-700">Tax</p>
                <p className="font-semibold text-gray-800">₹{Number(order.tax_amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Total</p>
                <p className="font-bold text-gray-800 text-lg">₹{Number(order.total_amount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <Separator className="lg:hidden" />
          <div className="lg:w-48 flex flex-col gap-2">
            <Link href={`/account/orders/${order.id}`}>
              <Button variant="outline" className="w-full gap-2 border-gray-300">
                View Details
              </Button>
            </Link>

            {canTrack && (
              <Button
                onClick={() => onTrack(order.id)}
                disabled={isUpdating}
                variant="outline"
                className="w-full gap-2 border-gray-300"
              >
                <Truck className="w-4 h-4" />
                Track
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(order.id)}
                disabled={isUpdating}
                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Cancel
              </Button>
            )}

            {canReturn && (
              <Button
                onClick={() => onReturn(order.id)}
                disabled={isUpdating}
                variant="outline"
                className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Return
              </Button>
            )}

            {order.order_status === 'delivered' && (
              <Button variant="outline" className="w-full gap-2 text-green-600 border-green-200 hover:bg-green-50">
                <Check className="w-4 h-4" />
                Reorder
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}