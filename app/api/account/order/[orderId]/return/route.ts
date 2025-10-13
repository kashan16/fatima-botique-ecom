import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiResponse } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params : Promise<{
        orderId: string;
    }>
}

interface ReturnRequest {
    items: Array<{
        order_item_id: string;
        quantity: number;
    }>;
    reason: string;
}

// POST - Initiate return process

export async function POST(req: NextRequest, { params } : RouteParams) {
    try {
        const { userId } = getAuth(req);
        const { orderId } = await params;
        const { items, reason } : ReturnRequest = await req.json();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to request returns' },
                { status: 401 }
            );
        }
        
        if (!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'Return reason is required' },
                { status: 400 }
            );
        }
    
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'At least one item must be selected for return' },
                { status: 400 }
            );
        }
        
        // Verify the order exists and belongs to the user
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('order_status, created_at, order_items(id, quantity)')
            .eq('id', orderId)
            .eq('user_id', userId)
            .single();
    
        if (orderError) {
            if (orderError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Order not found' },
                    { status: 404 }
                );
            }
            throw orderError;
        }
        
        // Check if order can be returned
        if (order.order_status !== 'delivered') {
            return NextResponse.json(
                { error: 'Bad Request', message: 'Only delivered orders can be returned' },
                { status: 400 }
            );
        }
    
        // Check if within return window (30 days)
        const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        const orderDate = new Date(order.created_at);
        const now = new Date();
    
        if (now.getTime() - orderDate.getTime() > returnWindow) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'Return window has expired (30 days)' },
                { status: 400 }
            );
        }
        
        // Validate return items
        const orderItemIds = order.order_items.map((item) => item.id);
        for (const returnItem of items) {
            if (!orderItemIds.includes(returnItem.order_item_id)) {
                return NextResponse.json(
                    { error: 'Bad Request', message: 'Invalid order item ID' },
                    { status: 400 }
                );
            }
      
            const orderItem = order.order_items.find((item) => item.id === returnItem.order_item_id);
            if (returnItem.quantity > orderItem?.quantity) {
                return NextResponse.json(
                    { error: 'Bad Request', message: 'Return quantity exceeds ordered quantity' },
                    { status: 400 }
                );
            }
        }
        
        // Create return request (in a real implementation, you'd have a returns table)
        // For now, we'll update order status and create status history
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                order_status: 'returned',
                updated_at: new Date().toISOString(),
                notes: `Return requested: ${reason}. Items: ${JSON.stringify(items)}`
            })
            .eq('id', orderId);
    
        if (updateError) {
            throw updateError;
        }
    
        // Add status history entry
        const { error: historyError } = await supabaseAdmin
            .from('order_status_history')
            .insert({
                order_id: orderId,
                status: 'returned',
                notes: `Return requested by user: ${reason}`,
                changed_by: userId
            });
    
        if (historyError) {
            console.error('Error creating status history:', historyError);
        }
    
        const response: ApiResponse<{ message: string; return_id?: string }> = {
            success: true,
            data: { 
                message: 'Return request submitted successfully',
                return_id: `ret_${Date.now()}` // In real implementation, this would be a proper return ID
            },
            message: 'Return request has been submitted. Our team will contact you soon.'
        };
    
        return NextResponse.json(response);
    } catch(error) {
        console.error('Error processing return request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to process return request' },
            { status: 500 }
        );
    }
}