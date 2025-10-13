import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
    
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await req.json();
        const { 
            shipping_address_id, 
            billing_address_id, 
            payment_method,
            notes 
        } = body;
    
        // Validate required fields
        if (!shipping_address_id || !billing_address_id || !payment_method) {
            return NextResponse.json({ 
                error: 'Shipping address, billing address, and payment method are required' 
            }, { status: 400 });
        }
    
        // Get user's cart with items and calculate totals
        const { data: cart, error: cartError } = await supabaseAdmin
            .from('carts')
            .select(`
                *,
                cart_items:cart_items(
                    *,
                    product_variant:product_variants(
                        *,
                        product:products(*)
                    )
                )
            `)
            .eq('user_id', userId)
            .single();
    
            if (cartError || !cart) {
                console.error('Error fetching cart for checkout:', cartError);
                return NextResponse.json({ error: 'Cart not found or empty' }, { status: 404 });
            }
    
            if (!cart.cart_items || cart.cart_items.length === 0) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }
    
            // Verify addresses belong to user
            const { data: shippingAddress, error: shippingError } = await supabaseAdmin
                .from('addresses')
                .select('*')
                .eq('id', shipping_address_id)
                .eq('user_id', userId)
                .single();
    
            if (shippingError || !shippingAddress) {
                return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 });
            }
    
            const { data: billingAddress, error: billingError } = await supabaseAdmin
                .from('addresses')
                .select('*')
                .eq('id', billing_address_id)
                .eq('user_id', userId)
                .single();
    
            if (billingError || !billingAddress) {
                return NextResponse.json({ error: 'Invalid billing address' }, { status: 400 });
            }
    
            // Calculate order totals
            const subtotal = (cart.cart_items as CartItem[]).reduce((total: number, item: CartItem) => {
                const productPrice = item.product_variant.product?.base_price || 0;
                const priceAdjustment = item.product_variant.price_adjustment || 0;
                const finalPrice = productPrice + priceAdjustment;
                return total + (finalPrice * item.quantity);
            }, 0);
    
            const shippingCost = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
            const taxAmount = subtotal * 0.18; // 18% GST
            const totalAmount = subtotal + shippingCost + taxAmount;
    
            // Generate order number
            const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
            // Create the order
            const { data: order, error: orderError } = await supabaseAdmin
                .from('orders')
                .insert([{
                    order_number: orderNumber,
                    user_id: userId,
                    shipping_address_id,
                    billing_address_id,
                    subtotal,
                    shipping_cost: shippingCost,
                    tax_amount: taxAmount,
                    total_amount: totalAmount,
                    currency: 'INR',
                    payment_status: payment_method === 'cod' ? 'cod_pending' : 'pending',
                    order_status: 'pending',
                    payment_method,
                    notes,
                    payment_provider: payment_method === 'cod' ? 'cod' : 'razorpay'
                }])
                .select()
                .single();
    
            if (orderError) {
                console.error('Error creating order:', orderError);
                return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
            }
    
            // Create order items
            interface CartItem {
                product_variant_id: number;
                product_variant: {
                    sku: string;
                    size: string;
                    color: string;
                    price_adjustment?: number;
                    product?: {
                        name?: string;
                        base_price?: number;
                    };
                };
                quantity: number;
            }
    
            const orderItems = (cart.cart_items as CartItem[]).map((item) => ({
                order_id: order.id,
                product_variant_id: item.product_variant_id,
                product_name: item.product_variant.product?.name || 'Unknown Product',
                variant_sku: item.product_variant.sku,
                size: item.product_variant.size,
                color: item.product_variant.color,
                price_at_purchase: (item.product_variant.product?.base_price || 0) + (item.product_variant.price_adjustment || 0),
                quantity: item.quantity,
                subtotal: ((item.product_variant.product?.base_price || 0) + (item.product_variant.price_adjustment || 0)) * item.quantity
            }));
    
            const { error: itemsError } = await supabaseAdmin
                .from('order_items')
                .insert(orderItems);
    
            if (itemsError) {
                console.error('Error creating order items:', itemsError);
      
                // Rollback order creation if items fail
                await supabaseAdmin
                    .from('orders')
                    .delete()
                    .eq('id', order.id);
      
                    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
                }
    
                // Create initial status history
                const { error: statusError } = await supabaseAdmin
                    .from('order_status_history')
                    .insert([{
                        order_id: order.id,
                        status: 'pending',
                        notes: 'Order created successfully',
                        changed_by: 'system'
                    }]);
    
                if (statusError) {
                        console.error('Error creating status history:', statusError);
                        // Continue anyway as this is not critical
                }
                    
                // Clear the cart after successful order creation
                const { error: clearCartError } = await supabaseAdmin
                    .from('cart_items')
                    .delete()
                    .eq('cart_id', cart.id);
    
                if (clearCartError) {
                    console.error('Error clearing cart:', clearCartError);
                    // Continue anyway as order is already created
                }
    
                // Return order details
                const { data: completeOrder, error: fetchError } = await supabaseAdmin
                    .from('orders')
                    .select(`
                        *,
                        order_items(*),
                        shipping_address:addresses!shipping_address_id(*),
                        billing_address:addresses!billing_address_id(*)
                        `)    
                    .eq('id', order.id)
                    .single();
    
                if (fetchError) {
                    console.error('Error fetching complete order:', fetchError);
                    // Return basic order if detailed fetch fails
                    return NextResponse.json({ 
                        message: 'Order created successfully',
                        order,
                        requires_payment: payment_method !== 'cod'
                    }, { status: 201 });
                }
    
                return NextResponse.json({ 
                    message: 'Order created successfully',
                    order: completeOrder,
                    requires_payment: payment_method !== 'cod'
                }, { status: 201 });
            } catch (error) {
                console.error('Error in POST /api/checkout:', error);
                return NextResponse.json({ 
                    error: 'Internal server error' 
                }, { status: 500 });
            }
}