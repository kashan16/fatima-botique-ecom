import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
    try {
        // Get authenticated user from Clerk (server-side)
        const { userId } = getAuth(req);
    
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized - not logged in' },
                { status: 401 }
            );
        }
    
        // Get user_id from request body (optional - for validation)
        const body = await req.json();
        const requestedUserId = body.user_id;
    
        // Validate that the authenticated user matches the requested user
        if (requestedUserId && userId !== requestedUserId) {
            return NextResponse.json(
                { error: 'Unauthorized - user mismatch' },
                { status: 403 }
            );
        }
    
        // Call the database function
        const { data, error } = await supabaseAdmin
            .rpc('initialize_user_assets', { p_user_id: userId });
    
        if (error) {
            console.error('Database error initializing user assets:', error);
            throw error;
        }
    
        // Log successful initialization for monitoring
        console.log(`Initialized assets for user ${userId}`, {
            cart_id: data.cart_id,
            wishlist_id: data.wishlist_id,
            timestamp: data.timestamp
        });
    
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error initializing user assets:', error);
    
        // Type-safe error handling
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCode = (error) || 'UNKNOWN_ERROR';
    
        return NextResponse.json(
            { 
                error: 'Failed to initialize user assets',
                message: errorMessage,
                code: errorCode
            },
            { status: 500 }
        );
    }
}