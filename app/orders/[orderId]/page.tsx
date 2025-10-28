'use client';

import { useOrder } from '@/hooks/useOrder';
import type { OrderWithDetails } from '@/types';
import { ArrowLeft, Check, CreditCard, MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// UI components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderPageClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string | undefined;

  const { fetchOrderById } = useOrder();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const o = await fetchOrderById(orderId);
        if (!mounted) return;
        if (!o) {
          setError('Order not found');
          setOrder(null);
        } else {
          setOrder(o);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
        setOrder(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [orderId, fetchOrderById]);

  if (loading) return <OrderLoadingSkeleton />;
  if (error) return <OrderErrorState error={error} onBack={() => router.back()} />;
  if (!order) return null;

  return <OrderDetails order={order} onBack={() => router.back()} />;
}

// Loading State Component
function OrderLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Error State Component
function OrderErrorState({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Link href="/account/orders">
              <Button className="gap-2">
                View All Orders
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Order Details Component
function OrderDetails({ order, onBack }: { order: OrderWithDetails; onBack: () => void }) {
  const items = order.order_items ?? [];
  const shipping = order.shipping_address ?? null;
  const billing = order.billing_address ?? null;

  const getPaymentStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      completed: "default",
      failed: "destructive",
      refunded: "secondary",
      cod_pending: "outline",
    };
    return variants[status] || "outline";
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

  const orderStatusLabel = formatOrderStatusLabel(order.order_status);
  const paymentStatusLabel = formatPaymentStatusLabel(order.payment_status);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-full p-3 mt-1">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                    Order #{order.order_number}
                  </h1>
                  <Badge 
                    variant={getPaymentStatusVariant(order.payment_status)} 
                    className="text-sm font-medium"
                  >
                    {paymentStatusLabel.title}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {orderStatusLabel.description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Link href="/account/orders">
              <Button variant="outline" className="gap-2">
                All Orders
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="w-5 h-5" />
                  Order Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">No items found in this order</p>
                    </div>
                  ) : items.map((item, index) => (
                    <div key={item.id ?? `${item.product_variant_id}-${item.product_name}`}>
                      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-base mb-1 truncate">
                            {item.product_name}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                            <span>Size: {item.size}</span>
                            <span>•</span>
                            <span>Color: {item.color}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • SKU: {item.variant_sku}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            ₹{(Number(item.price_at_purchase) * Number(item.quantity)).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ₹{Number(item.price_at_purchase).toFixed(2)} each
                          </div>
                        </div>
                      </div>
                      {index < items.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-background border rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground capitalize">
                        {order.payment_method?.replace('_', ' ') || 'Payment Method'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {paymentStatusLabel.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="rounded-xl border shadow-sm sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {order.shipping_cost === 0 ? 'FREE' : `₹${Number(order.shipping_cost).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₹{Number(order.tax_amount).toFixed(2)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-green-600">-₹{Number(order.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold">₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shipping ? (
                  <div className="space-y-3 text-sm">
                    <div className="font-semibold text-foreground">{shipping.full_name}</div>
                    <div className="text-muted-foreground">{shipping.phone_number}</div>
                    <div className="text-muted-foreground leading-relaxed">
                      {shipping.address_line1}
                      {shipping.address_line2 && <>, {shipping.address_line2}</>}
                      <br />
                      {shipping.city}, {shipping.state} - {shipping.pincode}
                      {shipping.landmark && <><br />Landmark: {shipping.landmark}</>}
                    </div>
                  </div>
                ) : billing ? (
                  <div className="space-y-3 text-sm">
                    <div className="font-semibold text-foreground">{billing.full_name}</div>
                    <div className="text-muted-foreground">{billing.phone_number}</div>
                    <div className="text-muted-foreground leading-relaxed">
                      {billing.address_line1}
                      {billing.address_line2 && <>, {billing.address_line2}</>}
                      <br />
                      {billing.city}, {billing.state} - {billing.pincode}
                      {billing.landmark && <><br />Landmark: {billing.landmark}</>}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4 text-sm">
                    No address information available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Order Number</div>
                  <div className="font-medium">{order.order_number}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Order Date</div>
                  <div className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Order Status</div>
                  <div className="font-medium">{orderStatusLabel.title}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Payment Status</div>
                  <div className="font-medium">{paymentStatusLabel.title}</div>
                </div>
                {order.notes && (
                  <div>
                    <div className="text-muted-foreground mb-1">Order Notes</div>
                    <div className="font-medium">{order.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}