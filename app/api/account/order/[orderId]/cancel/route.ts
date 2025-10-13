import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiResponse } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{
        orderId: string;
    }>
}

//POST - cancel order
export async function POST(req: NextRequest, { params } : RouteParams) {
    try {
        const { userId } = getAuth(req);
        const { orderId } = await params;
        const { reason } = await req.json();

        if(!userId) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to cancel orders' },
                { status: 401 }
            );
        }
        if(!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'Cancellation reason is required' },
                { status: 400 }
            );
        }
        
        // First, verify the order exists and belongs to the user
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('order_status, payment_status')
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
        
        // Check if order can be cancelled
        if (!['pending', 'confirmed'].includes(order.order_status)) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'This order cannot be cancelled' },
                { status: 400 }
            );
        }
        
        // Start a transaction to update order and create status history
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                order_status: 'cancelled',
                updated_at: new Date().toISOString()
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
                status: 'cancelled',
                notes: `Cancelled by user: ${reason}`,
                changed_by: userId
            });
    
        if (historyError) {
            console.error('Error creating status history:', historyError);
            // Continue even if history fails
            }
    
            // If payment was completed, initiate refund
            if (order.payment_status === 'completed') {
                // In a real implementation, you would integrate with your payment provider here
                // For now, we'll just update the payment status
                await supabaseAdmin
                    .from('order_payments')
                    .update({
                        status: 'refunded',
                        updated_at: new Date().toISOString()
                    })
                    .eq('order_id', orderId)
                    .eq('status', 'captured');
      
                // Update order payment status
                await supabaseAdmin
                    .from('orders')
                    .update({
                        payment_status: 'refunded',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId);
                }
    
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Order cancelled successfully' },
                message: 'Order has been cancelled and refund initiated if applicable'
            };
    
        return NextResponse.json(response);
    } catch(error) {
        console.error('Error cancelling order:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to cancel order' },
            { status: 500 }
        );
    }
}