import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Address, CreateAddressInput } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function validatePincode(pincode: string): boolean {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
}
interface RouteParams {
    params: Promise<{
        id: string;
    }>
}

export async function GET(req: NextRequest, { params } : RouteParams) {
    try {
        const { userId } = getAuth(req);
        const { id } = await params;
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: address, error } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if(error) {
            if(error.cause === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Address not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching address:', error);
            return NextResponse.json(
                { error: 'Failed to fetch address' },
                { status: 500 }
            );
        }
        return NextResponse.json({
            address: address as Address
        });
    } catch(error) {
        console.error('Address GET error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest, { params } : RouteParams) {
    try {
        const { userId } = getAuth(req);
        const { id } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: Partial<CreateAddressInput> = await req.json();

        // Verify ownership
        const { data: existingAddress, error: checkError } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
    
        if (checkError || !existingAddress) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        // Validate individual fields if provided
        const errors: string[] = [];
    
        if (body.full_name !== undefined) {
            if (!body.full_name?.trim()) {
                errors.push('Full name cannot be empty');
            } else if (body.full_name.length > 100) {
                errors.push('Full name must be less than 100 characters');
            }
        }
    
        if (body.phone_number !== undefined) {
            if (!body.phone_number?.trim()) {
                errors.push('Phone number cannot be empty');
            } else if (!validatePhoneNumber(body.phone_number)) {
                errors.push('Phone number must be a valid 10-digit Indian mobile number');
            }
        }
    
        if (body.pincode !== undefined) {
            if (!body.pincode?.trim()) {
                errors.push('Pincode cannot be empty');
            } else if (!validatePincode(body.pincode)) {
                errors.push('Pincode must be a valid 6-digit code');
            }
        }
    
        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }
    
        // If setting as default, unset other defaults
        if (body.is_default === true) {
            const addressType = body.address_type || existingAddress.address_type;
            const typeConditions = addressType === 'both'
                ? `address_type.eq.shipping,address_type.eq.billing,address_type.eq.both`
                : `address_type.eq.${addressType},address_type.eq.both`;
      
            await supabaseAdmin
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', userId)
                .neq('id', id)
                .or(typeConditions);
            }
    
        // Prepare update data
        const updateData: Record<string, string | boolean | null> = {
            updated_at: new Date().toISOString()
        };
    
        if (body.full_name !== undefined) updateData.full_name = body.full_name.trim();
        if (body.phone_number !== undefined) updateData.phone_number = body.phone_number.replace(/\D/g, '');
        if (body.address_line1 !== undefined) updateData.address_line1 = body.address_line1.trim();
        if (body.address_line2 !== undefined) updateData.address_line2 = body.address_line2?.trim() || null;
        if (body.city !== undefined) updateData.city = body.city.trim();
        if (body.state !== undefined) updateData.state = body.state.trim();
        if (body.pincode !== undefined) updateData.pincode = body.pincode.trim();
        if (body.landmark !== undefined) updateData.landmark = body.landmark?.trim() || null;
        if (body.address_type !== undefined) updateData.address_type = body.address_type;
        if (body.is_default !== undefined) updateData.is_default = body.is_default;

        // Update address
        const { data: updatedAddress, error: updateError } = await supabaseAdmin
            .from('addresses')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
    
        if (updateError) {
            console.error('Error updating address:', updateError);
            return NextResponse.json(
                { error: 'Failed to update address' },
                { status: 500 }
            );
        }
    
        return NextResponse.json({
            address: updatedAddress as Address,
            message: 'Address updated successfully'
        });
    } catch(error) {
        console.error('Address PATCH error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params } : RouteParams) {
    try {
        const { userId } = getAuth(req);
        const { id } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if address is used in any active orders
        const { data: ordersWithAddress, error: orderCheckError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .or(`shipping_address_id.eq.${id},billing_address_id.eq.${id}`)
            .in('order_status', ['pending', 'confirmed', 'processing', 'shipped']);
    
        if (orderCheckError) {
            console.error('Error checking orders:', orderCheckError);
        }
    
        if (ordersWithAddress && ordersWithAddress.length > 0) {
            return NextResponse.json(
                { 
                    error: 'Cannot delete address',
                    message: 'This address is associated with active orders'
                },
                { status: 400 }
            );
        }

        // Check if this is the default address
        const { data: addressToDelete } = await supabaseAdmin
            .from('addresses')
            .select('is_default, address_type')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
            
        // Delete address
        const { error: deleteError } = await supabaseAdmin
            .from('addresses')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        
        if (deleteError) {
            console.error('Error deleting address:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete address' },
                { status: 500 }
            );
        }

        // If deleted address was default, set another as default
        if (addressToDelete?.is_default) {
            const typeConditions = addressToDelete.address_type === 'both'
                ? `address_type.eq.shipping,address_type.eq.billing,address_type.eq.both`
                : `address_type.eq.${addressToDelete.address_type},address_type.eq.both`;
      
            const { data: remainingAddresses } = await supabaseAdmin
                .from('addresses')
                .select('id')
                .eq('user_id', userId)
                .or(typeConditions)
                .limit(1);
      
            if (remainingAddresses && remainingAddresses.length > 0) {
                await supabaseAdmin
                    .from('addresses')
                    .update({ is_default: true })
                    .eq('id', remainingAddresses[0].id);
                }
            }
    
        return NextResponse.json({
            message: 'Address deleted successfully'
        });
    } catch(error) {
        console.error('Address DELETE error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}