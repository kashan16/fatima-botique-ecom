import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req : NextRequest) {
    try {
        const { userId } = getAuth(req);
        if(!userId) {
            return NextResponse.json({ error : 'Unauthorized' } , { status : 401 });
        }

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
                )`
            )
            .eq('user_id', userId)
            .single();

            //Handle case where no cart exists
            if(cartError && cartError.code !== 'PGRST116') {
                console.error('Error fetching cart :', cartError);
                return NextResponse.json({ error : 'Failed to fetch cart' }, { status : 500 });
            }

            if(!cart) {
                return NextResponse.json({
                    cart : null,
                    cartItems : []
                });
            }

            const cartItems = cart.cart_items?.map((item: { product_variant: unknown; }) => ({
                ...item,
                product_variant : item.product_variant
            })) || [];

            return NextResponse.json({
                cart : {
                    id : cart.id,
                    user_id : cart.user_id,
                    created_at : cart.created_at,
                    updated_at : cart.updated_at
                },
                cartItems
            });
    } catch(error) {
        console.error('Error in GET /api/cart : ', error);
        return NextResponse.json({ error : 'Internal server error' }, { status : 500 });
    }
}

export async function POST(req : NextRequest) {
    try {
        const { userId } = getAuth(req);

        if(!userId) {
            return NextResponse.json({ error : 'Unauthorized'} , { status : 401 });
        }

        const body = await req.json();
        const { product_variant_id, quantity = 1, item_type = 'cart' } = body;

        if(!product_variant_id) {
            return NextResponse.json({ error : 'Product variant ID is required' }, { status : 400 });
        }

        if(quantity < 1) {
            return NextResponse.json({ error : 'Quantity must be atleast 1'}, { status : 400 });
        }

        const { data: productVariant, error: variantError } = await supabaseAdmin
            .from('product_variants')
            .select(`*, product:products(*)`)
            .eq('id', product_variant_id)
            .eq('is_available', true)
            .single()
        
        if(variantError || !productVariant) {
            console.error('Variant error:', variantError);
            return NextResponse.json({ error : 'Product variant not found or unavailable' }, { status : 404 });
        }

        if(productVariant.stock_quantity < quantity) {
            return NextResponse.json({
                error : 'Insufficient stock',
                availableStock : productVariant.stock_quantity
            }, { status : 400 });
        }

        let cart;
        const { data: existingCart, error: cartError } = await supabaseAdmin
            .from('carts')
            .select('*')
            .eq('user_id', userId)
            .single()
        
        if(cartError && cartError.code !== 'PGRST116') {
            console.error('Error checking cart : ', cartError);
            return NextResponse.json({ error : 'Failed to check cart' }, { status : 500 });
        }

        if(!existingCart) {
            const { data: newCart, error: createError } = await supabaseAdmin
                .from('carts')
                .insert([{ user_id : userId }])
                .select()
                .single();
            
            if(createError) {
                console.error('Error creating cart : ', createError);
                return NextResponse.json({ error : 'Failed to create cart' }, { status : 500 });
            }
            cart = newCart;
        } else {
            cart = existingCart;
        }

        // FIXED: Properly handle PGRST116 error (no rows found)
        const { data : existingItem, error : itemError } = await supabaseAdmin
            .from('cart_items')
            .select('*')
            .eq('cart_id', cart.id)
            .eq('product_variant_id', product_variant_id)
            .eq('item_type', item_type)
            .single();

        let cartItem;
        
        // Handle the case where no existing item is found (PGRST116 is normal/expected)
        if (itemError && itemError.code !== 'PGRST116') {
            console.error('Error checking existing cart item:', itemError);
            return NextResponse.json({ 
                error: 'Failed to check existing cart item' 
            }, { status: 500 });
        }
            
        // If item exists, update quantity
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if(productVariant.stock_quantity < newQuantity) {
                return NextResponse.json({
                    error : 'Insufficient stock for updated quantity',
                    availableStock : productVariant.stock_quantity
                }, { status : 400 });
            }

            const { data : updatedItem, error: updateError } = await supabaseAdmin
                .from('cart_items')
                .update({
                    quantity : newQuantity,
                    updated_at : new Date().toISOString()
                })
                .eq('id', existingItem.id)
                .select(`*,product_variant:product_variants(*, product:products(*))`)
                .single()
            
            if(updateError) {
                console.error('Error updating cart item : ', updateError);
                return NextResponse.json({
                    error : 'Failed to update cart item'
                }, {
                    status : 500
                });
            } 
            cartItem = updatedItem;
        } else {
            // Create new cart item
            const { data: newItem, error: insertError } = await supabaseAdmin
                .from('cart_items')
                .insert([{
                    cart_id: cart.id,
                    product_variant_id,
                    quantity,
                    item_type
                }])
                .select(`*,product_variant:product_variants(*,product:products(*))`)
                .single();
            
            if(insertError) {
                console.error('Error creating cart item : ', insertError);
                return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
            }
            cartItem = newItem;
        }
        
        return NextResponse.json({ 
            message: 'Item added to cart successfully',
            cartItem 
        }, { 
            status: 201 
        });
    } catch(error) {
        console.error('Error in POST /api/cart : ', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}