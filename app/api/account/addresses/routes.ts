import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Address, AddressType, CreateAddressInput } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Validation helpers
function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function validatePincode(pincode: string): boolean {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
}

function validateAddressInput(input: CreateAddressInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!input.full_name?.trim()) {
        errors.push('Full name is required');
    } else if (input.full_name.length > 100) {
        errors.push('Full name must be less than 100 characters');
    }
    if (!input.phone_number?.trim()) {
        errors.push('Phone number is required');
    } else if (!validatePhoneNumber(input.phone_number)) {
        errors.push('Phone number must be a valid 10-digit Indian mobile number');
    }
    if (!input.address_line1?.trim()) {
        errors.push('Address line 1 is required');
    } else if (input.address_line1.length > 200) {
        errors.push('Address line 1 must be less than 200 characters');
    }
    if (input.address_line2 && input.address_line2.length > 200) {
        errors.push('Address line 2 must be less than 200 characters');
    }
    if (!input.city?.trim()) {
        errors.push('City is required');
    } else if (input.city.length > 100) {
        errors.push('City name must be less than 100 characters');
    }
    if (!input.state?.trim()) {
        errors.push('State is required');
    } else if (input.state.length > 100) {
        errors.push('State name must be less than 100 characters');
    }
    if (!input.pincode?.trim()) {
        errors.push('Pincode is required');
    } else if (!validatePincode(input.pincode)) {
        errors.push('Pincode must be a valid 6-digit code');
    }
    if (input.landmark && input.landmark.length > 200) {
        errors.push('Landmark must be less than 200 characters');
    }
    const validAddressTypes: AddressType[] = ['shipping', 'billing', 'both'];
    if (!validAddressTypes.includes(input.address_type)) {
        errors.push('Address type must be shipping, billing, or both');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if(!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: addresses, error } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });
        
        if(error) {
            console.error('Error fetching addresses : ',error);
            return NextResponse.json(
                { error : 'Failed to fetch addresses' },
                { status : 500 }
            );
        }

        return NextResponse.json({
            addresses : addresses as Address[],
            count: addresses.length
        });
        
    } catch(error) {
        console.error('Addresses GET error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST - Create new address
export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
    
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    
        const body: CreateAddressInput = await req.json();
    
        // Validate input
        const validation = validateAddressInput(body);
        if (!validation.valid) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }
    
        // Check if this is the first address
        const { data: existingAddresses, error: countError } = await supabaseAdmin
            .from('addresses')
            .select('id')
            .eq('user_id', userId);
    
        if (countError) {
            console.error('Error checking existing addresses:', countError);
            return NextResponse.json(
                { error: 'Failed to check existing addresses' },
                { status: 500 }
            );
        }
    
        const isFirstAddress = !existingAddresses || existingAddresses.length === 0;
        const shouldBeDefault = body.is_default || isFirstAddress;
    
        // If setting as default, unset other defaults of the same type
        if (shouldBeDefault) {
            const typeConditions = body.address_type === 'both'
                ? `address_type.eq.shipping,address_type.eq.billing,address_type.eq.both`
                : `address_type.eq.${body.address_type},address_type.eq.both`;
      
            await supabaseAdmin
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', userId)
                .or(typeConditions);
        }
    
        // Clean phone number
        const cleanPhoneNumber = body.phone_number.replace(/\D/g, '');
    
        // Create address
        const { data: newAddress, error: createError } = await supabaseAdmin
            .from('addresses')
            .insert({
                user_id: userId,
                address_type: body.address_type,
                full_name: body.full_name.trim(),
                phone_number: cleanPhoneNumber,
                address_line1: body.address_line1.trim(),
                address_line2: body.address_line2?.trim() || null,
                city: body.city.trim(),
                state: body.state.trim(),
                pincode: body.pincode.trim(),
                landmark: body.landmark?.trim() || null,
                is_default: shouldBeDefault
            })
            .select()
            .single();
    
        if (createError) {
            console.error('Error creating address:', createError);
            return NextResponse.json(
                { error: 'Failed to create address' },
                { status: 500 }
            );
        }
    
        return NextResponse.json({
            address: newAddress as Address,
            message: 'Address created successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Address POST error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}