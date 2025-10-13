import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Address, AddressType } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if(!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { address_id } = body;

        if (!address_id) {
            return NextResponse.json(
                { error: 'Address ID is required' },
                { status: 400 }
            );
        }

        // Verify ownership and get address type
        const { data: address, error: fetchError } = await supabaseAdmin
            .from('addresses')
            .select('address_type')
            .eq('id', address_id)
            .eq('user_id', userId)
            .single();
    
        if (fetchError || !address) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        // Unset other defaults of the same type
        const addressType = address.address_type as AddressType;
        const typeConditions = addressType === 'both'
            ? `address_type.eq.shipping,address_type.eq.billing,address_type.eq.both`
            : `address_type.eq.${addressType},address_type.eq.both`;
    
        await supabaseAdmin
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId)
            .neq('id', address_id)
            .or(typeConditions);
    
        // Set new default
        const { data: updatedAddress, error: updateError } = await supabaseAdmin
            .from('addresses')
            .update({ is_default: true })
            .eq('id', address_id)
            .eq('user_id', userId)
            .select()
            .single();
    
        if (updateError) {
            console.error('Error setting default address:', updateError);
            return NextResponse.json(
                { error: 'Failed to set default address' },
                { status: 500 }
            );}
    
            return NextResponse.json({
                address: updatedAddress as Address,
                message: 'Default address updated successfully'
            });
    } catch(error) {
        console.error('Set default address error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}