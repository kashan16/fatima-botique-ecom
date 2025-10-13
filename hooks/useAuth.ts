import { supabase } from '@/lib/client';
import { UserProfile } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export const useAuth = () => {
    const { user, isSignedIn, isLoaded } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
        const initializeUser = async () => {
            if (isLoaded && isSignedIn && user) {
                try {
                    // Get or create user profile
                    const { data: existingProfile, error: fetchError } = await supabase
                        .from('user_profile')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();
                    if (fetchError && fetchError.code === 'PGRST116') {
                        // Profile doesn't exist, create one
                        const username = user.username || user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
                        const { data: newProfile, error: createError } = await supabase
                            .from('user_profile')
                            .insert([
                                {
                                    user_id: user.id,
                                    username: username,
                                    phone_number: null,
                                },
                            ])
                            .select()
                            .single();
                        if (createError) throw createError;
                        setProfile(newProfile);
                    } else if (fetchError) {
                        throw fetchError;
                    } else {
                        setProfile(existingProfile);
                    }
                } catch (error) {
                    console.error('Error initializing user:', error);
                }
            }
            setLoading(false);
        };
        initializeUser();
    }, [isLoaded, isSignedIn, user]);
    
    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) throw new Error('User not authenticated');
        const { data, error } = await supabase
            .from('user_profile')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();
        if (error) throw error;
        setProfile(data);
        return data;
    };
    return {
        user,
        profile,
        isSignedIn,
        isLoaded: isLoaded && !loading,
        updateProfile,
    };
};