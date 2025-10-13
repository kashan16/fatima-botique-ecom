import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiResponse, OrderStatusHistoryItem, OrderWithDetails } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params : Promise<{
        orderId: string;
    }>
}

export async function GET(req: NextRequest, { params } : RouteParams) {
    try {
        const { userId } = getAuth(req);
        const { orderId } = await params;

        if(!userId) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to view orders' },
                { status: 401 }
            );
        }

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`*,
                shipping_address:shipping_address_id(*),
                billing_address:billing_address_id(*),
                order_items(*),
                status_history:order_status_history(*),
                payments:order_payments(*)`
            )
            .eq('id', orderId)
            .eq('user_id', userId)
            .single();

        if(error) {
            if(error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Order not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching order:', error);
            return NextResponse.json(
                { error : 'Database error', message: 'Failed to fetch order' },
                { status : 500 }
            );
        }
        // Check if user can cancel or return
        const canCancel = ['pending', 'confirmed'].includes(order.order_status);
        const canReturn = order.order_status === 'delivered' &&
        new Date(order.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); //Within 30 days

        const orderDetails: OrderWithDetails & {
            status_history: OrderStatusHistoryItem[];
            can_cancel: boolean;
            can_return: boolean;
            return_window_days: number;
        } = {
            ...order,
            order_items: order.order_items || [],
            shipping_address: order.shipping_address,
            billing_address: order.billing_address,
            status_history: order.status_history || [],
            can_cancel: canCancel,
            can_return: canReturn,
            return_window_days: 30
        };

        const res : ApiResponse<typeof orderDetails> = {
            success: true,
            data: orderDetails
        };

        return NextResponse.json(res);
    } catch(error) {
        console.error('Error in order details API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Something went wrong' },
            { status: 500 }
        );
    }
}