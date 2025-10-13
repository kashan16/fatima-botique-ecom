import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req : NextRequest) {
    try {
        const { userId } = getAuth(req);
        if(!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: wishlist, error: wishlistError } = await supabaseAdmin
            .from('wishlists')
            .select(`
                *,
                wishlist_items:wishlist_items(
                    *,
                    product_variant:product_variants(
                        *,
                        product:products(*),
                        product_images:product_images(*)
                        )
                    )`
                )
            .eq('user_id', userId)
            .single()
        
        if(wishlistError && wishlistError.code !== 'PGRST116') {
            console.error('Error fetching wishlist : ', wishlistError);
            return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
        }

        if(!wishlist) {
            return NextResponse.json({
                wishlist: null,
                wishlistItems: []
            });
        }

        const wishlistItems = wishlist.wishlist_items?.map((item : { product_variant : unknown; })=> ({
            ...item,
            product_variant: item.product_variant
        })) || [];

        return NextResponse.json({
            wishlist: {
                id: wishlist.id,
                user_id: wishlist.user_id,
                created_at: wishlist.created_at,
                updated_at: wishlist.updated_at
            },
            wishlistItems
        });
    } catch(error) {
        console.error('Error in GET /api/wishlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req)
    
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await req.json();
        const { product_variant_id } = body;
        
        // Validate required fields
        if (!product_variant_id) {
            return NextResponse.json({ error: 'Product variant ID is required' }, { status: 400 });
        }
        
        // Check if product variant exists and is available
        const { data: productVariant, error: variantError } = await supabaseAdmin
            .from('product_variants')
            .select('*')
            .eq('id', product_variant_id)
            .eq('is_available', true)
            .single();
            
        if (variantError || !productVariant) {
            console.error('Variant error:', variantError);
            return NextResponse.json({ error: 'Product variant not found or unavailable' }, { status: 404 });
        }
        
        // Get or create user's wishlist
        let wishlist;
        const { data: existingWishlist, error: wishlistError } = await supabaseAdmin
            .from('wishlists')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (wishlistError && wishlistError.code !== 'PGRST116') {
            console.error('Error checking wishlist:', wishlistError);
            return NextResponse.json({ error: 'Failed to check wishlist' }, { status: 500 });
        }
        
        if (!existingWishlist) {
            // Create new wishlist
            const { data: newWishlist, error: createError } = await supabaseAdmin
                .from('wishlists')
                .insert([{ user_id: userId }])
                .select()
                .single();
            
            if (createError) {
                console.error('Error creating wishlist:', createError);
                return NextResponse.json({ error: 'Failed to create wishlist' }, { status: 500 });
            }
            wishlist = newWishlist;
        } else {
            wishlist = existingWishlist;
        }
        
        // Check if item already exists in wishlist - FIXED LOGIC
        const { data: existingItem, error: itemError } = await supabaseAdmin
            .from('wishlist_items')
            .select('*')
            .eq('wishlist_id', wishlist.id)
            .eq('product_variant_id', product_variant_id)
            .single();

        // Handle the case where no item is found (PGRST116 is normal)
        if (itemError && itemError.code !== 'PGRST116') {
            console.error('Error checking existing wishlist item:', itemError);
            return NextResponse.json({ 
                error: 'Failed to check if item exists in wishlist' 
            }, { status: 500 });
        }
            
        // If item already exists, return success but don't create duplicate
        if (existingItem) {
            return NextResponse.json({ 
                message: 'Item already in wishlist',
                wishlistItem: existingItem 
            }, { status: 200 }); // Still return 200, but frontend should handle this
        }
        
        // Create new wishlist item
        const { data: newItem, error: insertError } = await supabaseAdmin
            .from('wishlist_items')
            .insert([{
                wishlist_id: wishlist.id,
                product_variant_id,
            }])
            .select(`
                *,
                product_variant:product_variants(
                    *,
                    product:products(*),
                    product_images:product_images(*)
                )
            `)
            .single();
            
        if (insertError) {
            console.error('Error creating wishlist item:', insertError);
            return NextResponse.json({ error: 'Failed to add item to wishlist' }, { status: 500 });
        }
        
        return NextResponse.json({ 
            message: 'Item added to wishlist successfully',
            wishlistItem: newItem 
        }, { status: 201 });
    
    } catch (error) {
        console.error('Error in POST /api/wishlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}