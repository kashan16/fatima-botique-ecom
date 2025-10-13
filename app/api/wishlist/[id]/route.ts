import { supabase } from "@/lib/client";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params : Promise<{
        id : string;
    }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        // Await the params first
        const { id } = await params;
        const { userId } = getAuth(request);
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const wishlistItemId = id; // Use the awaited id
        // Verify the wishlist item belongs to the user's wishlist
        const { data: wishlistItem, error: verificationError } = await supabaseAdmin
            .from('wishlist_items')
            .select(`wishlist:wishlists(*)`)
            .eq('id', wishlistItemId)
            .single();
            
        if (verificationError || !wishlistItem) {
            return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
        }
        
        if (!wishlistItem.wishlist || !Array.isArray(wishlistItem.wishlist) || wishlistItem.wishlist.length === 0 || wishlistItem.wishlist[0].user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        // Delete the wishlist item
        const { error: deleteError } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('id', wishlistItemId);
        
        if (deleteError) {
            console.error('Error deleting wishlist item:', deleteError);
            return NextResponse.json({ error: 'Failed to delete wishlist item' }, { status: 500 });
        }
        
        return NextResponse.json({ 
            message: 'Item removed from wishlist successfully' 
        });
    } catch (error) {
        console.error('Error in DELETE /api/wishlist/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}