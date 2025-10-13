import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }

        const cartItemId = id;
        const body = await req.json();
        const { quantity } = body;

        if (!quantity || quantity < 1) {
            return NextResponse.json({
                error: 'Quantity must be at least 1'
            }, {
                status: 400
            });
        }

        // FIXED: Use proper relationship name
        const { data: cartItem, error: verificationError } = await supabaseAdmin
            .from('cart_items')
            .select(`
                *,
                cart:carts(*),
                product_variant:product_variants(*)
            `)
            .eq('id', cartItemId)
            .single();

        if (verificationError || !cartItem) {
            console.error('Verification error:', verificationError);
            return NextResponse.json({
                error: 'Cart item not found'
            }, {
                status: 404
            });
        }

        // FIXED: Access cart user_id properly
        if (cartItem.cart.user_id !== userId) {
            return NextResponse.json({
                error: 'Unauthorized'
            }, {
                status: 403
            });
        }

        if (cartItem.product_variant.stock_quantity < quantity) {
            return NextResponse.json({
                error: 'Insufficient stock',
                availableStock: cartItem.product_variant.stock_quantity
            }, { status: 400 });
        }

        const { data: updatedItem, error: updateError } = await supabaseAdmin
            .from('cart_items')
            .update({
                quantity,
                updated_at: new Date().toISOString(),
            })
            .eq('id', cartItemId)
            .select(`
                *,
                product_variant:product_variants(
                    *,
                    product:products(*)
                )
            `)
            .single();

        if (updateError) {
            console.error('Error updating cart item:', updateError);
            return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Cart item updated successfully',
            cartItem: updatedItem
        });
    } catch (error) {
        console.error('Error in PUT /api/cart/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const cartItemId = id;

        // FIXED: Use proper relationship and access pattern
        const { data: cartItem, error: verificationError } = await supabaseAdmin
            .from('cart_items')
            .select(`
                *,
                cart:carts(*)
            `)
            .eq('id', cartItemId)
            .single();

        if (verificationError || !cartItem) {
            console.error('Verification error:', verificationError);
            return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
        }

        // FIXED: Properly access the cart user_id
        // The cart is returned as an object, not an array
        if (!cartItem.cart || cartItem.cart.user_id !== userId) {
            console.log('Cart item cart:', cartItem.cart);
            console.log('User ID:', userId);
            return NextResponse.json({ error: 'Unauthorized - cart ownership mismatch' }, { status: 403 });
        }

        // Delete the cart item
        const { error: deleteError } = await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (deleteError) {
            console.error('Error deleting cart item:', deleteError);
            return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Cart item removed successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /api/cart/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}