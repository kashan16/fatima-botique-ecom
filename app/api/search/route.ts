import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        const { searchParams } = new URL(req.url);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        // Parse search parameters
        const query = searchParams.get('q') || undefined;
        const categoryIds = searchParams.get('categories')?.split(',') || undefined;
        const sizes = searchParams.get('sizes')?.split(',') || undefined;
        const colors = searchParams.get('colors')?.split(',') || undefined;
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '24');
        const inStockOnly = searchParams.get('inStockOnly') !== 'false';
    
        const offset = (page - 1) * limit;

        // Execute search query
        const { data: products, error } = await supabaseAdmin
            .rpc('search_products', {
                search_query: query,
                category_ids: categoryIds,
                sizes: sizes,
                colors: colors,
                min_price: minPrice,
                max_price: maxPrice,
                is_stock_only: inStockOnly,
                limit_count: limit,
                offset_count: offset
            });

        if(error) {
            console.error('Search error: ', error);
            return NextResponse.json(
                { error: 'Search failed'},
                { status : 500 }
            );
        }

        // Get aggregations for filters
        const { data: aggregations } = await supabaseAdmin
            .rpc('get_search_aggregations', {
                search_query: query
            });
         
        const totalCount = products[0]?.total_count || 0;
        
        type Product = {
            [key: string]: unknown;
            total_count?: number;
        };

        return NextResponse.json(
            { products : (products as Product[]).map((p) => ({ ...p, total_count: undefined })),
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            },
            aggregations: aggregations || []
        });


    } catch(error) {
        console.error('Search API error: ', error);
        return NextResponse.json(
            { error : 'Internal server error' },
            { status : 500 }
        );
    }
}