'use client';
import { useOrder } from '@/hooks/useOrder';
import { OrderStatus, OrderWithDetails, PaymentStatus } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ShadCN Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

export const OrdersPage = () => {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const {
    orders,
    loading,
    error,
    fetchOrderById,
    cancelOrder,
    returnOrder,
    trackOrder,
    refetch,
  } = useOrder();

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  /*const safeImageSrc = (path?: string | null): string => {
    if (!path) return '/placeholder.png';
    const trimmed = path.trim();
    if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `/${trimmed.replace(/^\/+/, '')}`;
  };*/

  const getStatusColor = (status: OrderStatus) => {
    const statusColors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      processing: 'bg-purple-50 text-purple-700 border-purple-200',
      shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      returned: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const statusColors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-blue-50 text-blue-700 border-blue-200',
      cod_pending: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleCancelOrder = async (orderId: string, reason?: string) => {
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    try {
      await cancelOrder(orderId, reason || 'Changed my mind');
      toast.success("Order cancelled successfully!");
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error("Failed to cancel order.");
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleReturnOrder = async (orderId: string, reason: string) => {
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    try {
      await returnOrder(orderId, reason);
      toast.success("Return request submitted successfully!");
    } catch (error) {
      console.error('Failed to process return:', error);
      toast.error("Failed to process return request.");
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      const order = await fetchOrderById(orderId);
      setSelectedOrder(order);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast.error("Failed to load order details.");
    }
  };

  const handleTrackOrder = async (orderId: string) => {
    try {
      const trackingInfo = await trackOrder(orderId);
      toast.info(`Order status: ${trackingInfo.currentStatus}. Estimated delivery: ${trackingInfo.estimatedDelivery}`);
    } catch (error) {
      console.error('Failed to track order:', error);
      toast.error("Failed to get tracking information.");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md shadow-lg bg-white rounded-lg">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-sans">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your order history.</p>
          <Button
            onClick={() => router.push('/sign-in')}
            className="bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mt-3 w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="p-8 text-center max-w-2xl mx-auto bg-white border border-red-200 shadow-sm rounded-lg">
            <h1 className="text-2xl font-bold text-red-800 mb-4 font-sans">Error Loading Orders</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => refetch()}
                className="bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Shopping
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center max-w-2xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4 font-sans">No Orders Yet</h1>
            <p className="text-gray-600 mb-8 text-lg">Your order history will appear here once you start shopping.</p>
            <Link
              href="/"
              className="bg-gray-900 hover:bg-gray-700 text-white px-8 py-4 rounded-md font-semibold font-sans inline-flex items-center transition-colors text-base"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const OrderItem = ({ order }: { order: OrderWithDetails }) => {
    const isUpdating = updatingOrders.has(order.id);
    const canCancel = ['pending', 'confirmed'].includes(order.order_status);
    const canReturn = order.order_status === 'delivered';
    const canTrack = ['confirmed', 'processing', 'shipped'].includes(order.order_status);

    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 transition-all duration-200 hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Order Header */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg font-sans">
                    Order #{order.order_number}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`px-3 py-1 text-sm font-medium ${getStatusColor(order.order_status)}`}>
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </Badge>
                  <Badge className={`px-3 py-1 text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-3">
                {order.order_items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm font-sans line-clamp-1">
                        {item.product_name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {item.size} | {item.color} | Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm font-sans">
                      ₹{item.price_at_purchase.toFixed(2)}
                    </p>
                  </div>
                ))}
                {order.order_items.length > 2 && (
                  <p className="text-sm text-gray-600 font-sans">
                    +{order.order_items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Items Total</p>
                  <p className="font-semibold text-gray-900 font-sans">₹{order.subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Shipping</p>
                  <p className="font-semibold text-gray-900 font-sans">
                    {order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost.toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Tax</p>
                  <p className="font-semibold text-gray-900 font-sans">₹{order.tax_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Total Amount</p>
                  <p className="font-bold text-gray-900 text-lg font-sans">₹{order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:w-48 flex lg:flex-col gap-2 justify-start">
              <Button
                onClick={() => handleViewOrderDetails(order.id)}
                variant="outline"
                className="w-full bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
              >
                View Details
              </Button>
              
              {canTrack && (
                <Button
                  onClick={() => handleTrackOrder(order.id)}
                  variant="outline"
                  className="w-full bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Track
                </Button>
              )}

              {canCancel && (
                <Button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={isUpdating}
                  variant="outline"
                  className="w-full bg-white border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Cancel
                </Button>
              )}

              {canReturn && (
                <Button
                  onClick={() => handleReturnOrder(order.id, 'Product not as expected')}
                  disabled={isUpdating}
                  variant="outline"
                  className="w-full bg-white border-orange-200 hover:bg-orange-50 text-orange-600 hover:text-orange-700 transition-colors"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Return
                </Button>
              )}

              {order.order_status === 'delivered' && (
                <Button
                  variant="outline"
                  className="w-full bg-white border-green-200 hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Reorder
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const OrderDetailsModal = ({ order }: { order: OrderWithDetails }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-gray-900 font-sans">
                Order Details - #{order.order_number}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Order Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 font-sans">Order Status</h4>
                <div className="flex items-center gap-3">
                  <Badge className={`px-3 py-2 text-base font-medium ${getStatusColor(order.order_status)}`}>
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </Badge>
                  <Badge className={`px-3 py-2 text-base font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 font-sans">Order Date</h4>
                <p className="text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 font-sans">Shipping Address</h4>
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <p className="font-medium text-gray-800">{order.shipping_address.full_name}</p>
                  <p className="text-gray-600">{order.shipping_address.phone_number}</p>
                  <p className="text-gray-600">
                    {order.shipping_address.address_line1}
                    {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                  </p>
                  <p className="text-gray-600">
                    {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 font-sans">Order Items</h4>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <Card key={item.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 font-sans">{item.product_name}</p>
                          <p className="text-gray-600 text-sm">
                            SKU: {item.variant_sku} | Size: {item.size} | Color: {item.color}
                          </p>
                          <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 font-sans">
                            ₹{item.price_at_purchase.toFixed(2)}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Subtotal: ₹{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 font-sans">Order Summary</h4>
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Items Total</span>
                    <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span className="font-semibold">₹{order.tax_amount.toFixed(2)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-₹{order.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-2 bg-gray-300" />
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans mb-4 sm:mb-0">
            Order History
          </h1>
          <div className="flex items-center gap-3">
            <Badge className="bg-gray-100 text-gray-800 border border-gray-200 text-lg px-4 py-2 rounded-full font-semibold font-sans">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </Badge>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </div>

        {selectedOrder && <OrderDetailsModal order={selectedOrder} />}
      </div>
    </div>
  );
};
