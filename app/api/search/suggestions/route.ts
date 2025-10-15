import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if(!query || query.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        const { data: suggestions, error } = await supabaseAdmin
            .rpc('get_search_suggestions', {
                partial_query: query,
                limit_count: 5
            });

        if(error) {
            console.error('Suggestions error: ', error);
            return NextResponse.json({ suggestions: [] });
        }

        return NextResponse.json({ suggestions });
    } catch(error) {
        console.error('Suggestions API error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}