import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserProfile } from "@/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if profile already exists
        const { data: existingProfile, error: checkError } = await supabaseAdmin
            .from('user_profile')
            .select('*')
            .eq('user_id', userId)
            .single();
    
        if (existingProfile) {
            // Profile already exists
            return NextResponse.json({
                profile: existingProfile as UserProfile,
                is_new: false,
                message: 'Profile already exists'
            });
        }

        if(checkError) {
            return NextResponse.json(
                { error : 'Failed to fetch profile' },
                { status : 404 }
            );
        }

        // Create new profile
        const { data: newProfile, error: createError } = await supabaseAdmin
            .from('user_profile')
            .insert({
                user_id: userId,
                username: null,
                phone_number: null
            })
            .select()
            .single();
    
        if (createError) {
            console.error('Error creating profile:', createError);
            return NextResponse.json(
                { error: 'Failed to create profile' },
                { status: 500 }
            );
        }
    
        return NextResponse.json({
            profile: newProfile as UserProfile,
            is_new: true,
            message: 'Profile created successfully'
        });
    } catch(error) {
        console.error('Profile initialize error : ', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}