import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserProfile } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Validation helpers
function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function validateUsername(username: string): boolean {
    if (username.length < 3 || username.length > 30) return false;
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        const { data: profile, error } = await supabaseAdmin
            .from('user_profile')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            return NextResponse.json(
                { error: 'Failed to fetch profile' },
                { status: 500 }
            );
        }
        
        // If no profile exists, return null (not an error)
        if (!profile) {
            return NextResponse.json({
                profile: null,
                exists: false
            });
        }
        
        return NextResponse.json({
            profile: profile as UserProfile,
            exists: true
        });
    } catch(error) {
        console.error('Profile GET error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if(!userId) {
            return NextResponse.json(
                { error : 'Unauthorized' },
                { status : 401 }
            );
        }

        const body = await req.json();
        const { username, phone_number } = body;

        //validate inputs
        const errors : string[] = [];

        if (username !== undefined) {
            if (typeof username !== 'string') {
                errors.push('Username must be a string');
            } else if (username.trim() && !validateUsername(username.trim())) {
                errors.push('Username must be 3-30 characters and contain only letters, numbers, and underscores');
            }
        }
    
        if (phone_number !== undefined && phone_number !== null) {
            if (typeof phone_number !== 'string') {
                errors.push('Phone number must be a string');
            } else {
                const cleanPhone = phone_number.replace(/\D/g, '');
                if (cleanPhone && !validatePhoneNumber(cleanPhone)) {
                    errors.push('Phone number must be a valid 10-digit Indian mobile number');
                }
            }
        }
    
        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }
        
        // Prepare update data
        const updateData: { username?: string; phone_number?: string; updated_at: string } = {
            updated_at: new Date().toISOString()
        };
    
        if (username !== undefined) {
            updateData.username = username.trim() || null;
        }
    
        if (phone_number !== undefined) {
            updateData.phone_number = phone_number ? phone_number.replace(/\D/g, '') : null;
        }
        
        // Update profile
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('user_profile')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();
    
        if (updateError) {
            console.error('Error updating profile:', updateError);
            return NextResponse.json(
                { error: 'Failed to update profile' },
                { status: 500 }
            );
        }
    
        return NextResponse.json({
            profile: updatedProfile as UserProfile,
            message: 'Profile updated successfully'
        });
    } catch(error) {
        console.error('Profile PATCH error : ', error);
        return NextResponse.json(
            {
                error : 'Internal server error',
                message : error instanceof Error ? error.message : 'Unknow error'
            },
            { status : 500 }
        )
    }
}