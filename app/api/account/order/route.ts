import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { OrderStatus, OrderSummary, PaymentStatus } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, PaginatedResponse } from './../../../../types';

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if(!userId) {
            return NextResponse.json(
                { error : 'Unauthorized', message : 'You must be logged in to view orders' },
                { status : 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') as OrderStatus | null;
        const payment_status = searchParams.get('payment_status') as PaymentStatus | null;
        const date_from = searchParams.get('date_from');
        const date_to = searchParams.get('date_to');
        
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
            .from('orders')
            .select(`*,
                shipping_address:shipping_address_id(*),
                billing_address:billing_address_id(*),
                order_items(*)`
                ,{ count : 'exact'}
            )
            .eq('user_id', userId)
            .order('created_at', { ascending : false })
            .range(offset, offset + limit - 1);
        
        if(status) {
            query = query.eq('order_status', status);
        }

        if(payment_status) {
            query = query.eq('payment_status', payment_status);
        }

        if(date_from) {
            query = query.gte('created_at', date_from);
        }

        if(date_to) {
            query = query.lte('created_at', date_to);
        }

        const { data: orders, error, count } = await query;

        if(error) {
            console.error('Error fetching orders : ', error);
            return NextResponse.json(
                { error : 'Database Error', message : 'Failed to fetch orders' },
                { status : 500 }
            );
        }

        const orderSummaries: OrderSummary[] = orders.map(order => {
            const firstItem = order.order_items?.[0];
            const thumbnailUrl = firstItem?.product_variant?.images?.[0]?.object_path;

            return {
                id: order.id,
                order_number: order.order_number,
                created_at: order.created_at,
                total_amount: order.total_amount,
                order_status: order.order_status,
                payment_status: order.payment_status,
                item_count: order.order_items?.length || 0,
                thumbnail_url: thumbnailUrl
            }
        });

        const res: ApiResponse<PaginatedResponse<OrderSummary>> = {
            success : true,
            data : {
                data : orderSummaries,
                total : count || 0,
                page,
                per_page : limit,
                total_pages : Math.ceil((count || 0) / limit)
            }
        };
        return NextResponse.json(res);
    } catch(error) {
        console.error('Error in orders API : ', error);
        return NextResponse.json(
            { error : 'Internal Server Error', message : 'Something went wrong' },
            { status : 500 }
        );
    }
}