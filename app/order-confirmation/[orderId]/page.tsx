'use client';

import { Button } from '@/components/ui/button';
import { useOrder } from '@/hooks/useOrder';
import { OrderWithDetails } from '@/types';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OrderConfirmationPage () {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.orderId as string | undefined;

    const { fetchOrderById } = useOrder();
    const [loading, setLoading] = useState<boolean>(true);
    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if(!orderId) {
            setError('No order id provided');
            setLoading(false);
            return;
        }
        let mounted = true;
        (
            async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const o = await fetchOrderById(orderId);
                    if(!mounted) return;
                    if(!o) {
                        setError('Order not found or you are not authorized to view it.');
                        setOrder(null);
                    } else {
                        setOrder(o);
                    }
                } catch(err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch order');
                    setOrder(null);
                } finally {
                    if(mounted) setLoading(false);
                }
            }
        )();
        return () => { mounted = false; };
    },[orderId, fetchOrderById]);

    if(loading) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <Loader2 className='h-12 w-12 animate-spin text-gray-700'/>
            </div>
        );
    }

    if(error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-md shadow p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-600">Unable to load order</h2>
                    <p className="mt-3 text-sm text-gray-600">{error}</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Button className="px-4 py-2 rounded bg-gray-100" onClick={() => router.back()}>Go back</Button>
                        <Link href="/orders" className="px-4 py-2 rounded bg-gray-900 text-white">My Orders</Link>
                    </div>
                </div>
            </div>
        );
    }

    //order is present
    const items = order?.order_items ?? [];
    const shipping = order?.shipping_address ?? null;
    const billing = order?.billing_address ?? null;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 rounded-full p-3">
                            <Check className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Thank you — your order is confirmed!</h1>
                            <p className="text-sm text-gray-600">Order <span className="font-medium">{order?.order_number}</span> was placed successfully.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700">Order Summary</h3>
                            <div className="rounded border p-4 bg-gray-50">
                                <div className="flex justify-between text-sm text-gray-700"><span>Subtotal</span><span>₹{Number(order?.subtotal).toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm text-gray-700 mt-1"><span>Shipping</span><span>₹{Number(order?.shipping_cost).toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm text-gray-700 mt-1"><span>Tax</span><span>₹{Number(order?.tax_amount).toFixed(2)}</span></div>
                                <div className="flex justify-between text-base font-semibold mt-3"><span>Total</span><span>₹{Number(order?.total_amount).toFixed(2)}</span></div>
                                <p className="mt-2 text-xs text-gray-500">Payment: <span className="font-medium">{order?.payment_method?.toUpperCase() ?? order?.payment_status}</span></p>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700">Shipping Address</h4>
                                {shipping ? (
                                    <div className="mt-2 text-sm text-gray-700">
                                        <div>{shipping.full_name}</div>
                                        <div>{shipping.address_line1}{shipping.address_line2 ? `, ${shipping.address_line2}` : ''}</div>
                                        <div>{shipping.city}, {shipping.state} - {shipping.pincode}</div>
                                        <div className="mt-1 text-xs text-gray-500">Phone: {shipping.phone_number}</div>
                                    </div>
                                ) : <div className="mt-2 text-sm text-gray-700">
                                        <div>{billing?.full_name}</div>
                                        <div>{billing?.address_line1}{billing?.address_line2 ? `, ${billing?.address_line2}` : ''}</div>
                                        <div>{billing?.city}, {billing?.state} - {billing?.pincode}</div>
                                        <div className="mt-1 text-xs text-gray-500">Phone: {billing?.phone_number}</div>
                                    </div>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-700">Items</h3>
                            <div className="mt-3 space-y-3">
                                {items.length === 0 ? (
                                    <p className="text-sm text-gray-500">No items found.</p>
                                ) : items.map((it) => (
                                <div key={it.id ?? `${it.product_variant_id}-${it.product_name}`} className="flex items-center justify-between border rounded p-3 bg-white">
                                    <div>
                                        <div className="text-sm font-medium">{it.product_name}</div>
                                        <div className="text-xs text-gray-500">{it.size} • {it.color} • {it.variant_sku}</div>
                                    </div>
                                    <div className="text-sm text-gray-700 text-right">
                                        <div>Qty: {it.quantity}</div>
                                        <div className="font-semibold">₹{(Number(it.price_at_purchase) * Number(it.quantity)).toFixed(2)}</div>
                                    </div>
                                </div>))}
                            </div>
                            <div className="mt-6">
                                <Link href={`/orders/${order?.id}`} className="inline-block px-4 py-2 bg-gray-900 text-white rounded">View Order Details</Link>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 text-sm text-gray-600">
                        <p>If you have questions about your order, contact support or visit <Link href="/support" className="text-sky-600 underline">Support</Link>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}