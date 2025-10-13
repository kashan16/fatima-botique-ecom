import { supabase } from '@/lib/client';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/validation';
import { UserProfile } from '@/types';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export const useProfile = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user profile
  const getProfile = async () => {
    if (!user) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('ser_id', user.id)
        .single();

      if (error) throw error;
      
      // Format phone number for display if it exists
      const formattedProfile = data ? {
        ...data,
        phone_number: data.phone_number ? formatPhoneNumber(data.phone_number) : null
      } : null;
      
      setProfile(formattedProfile);
      return formattedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create profile (on first login)
  const createProfile = async (profileData: {
    username?: string;
    phone_number?: string | null;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      // Validate phone number if provided
      if (profileData.phone_number && !validatePhoneNumber(profileData.phone_number)) {
        throw new Error('Please enter a valid 10-digit Indian phone number');
      }

      // Clean phone number (remove any formatting for storage)
      const cleanedPhoneNumber = profileData.phone_number 
        ? profileData.phone_number.replace(/\D/g, '')
        : null;

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            ser_id: user.id,
            username: profileData.username,
            phone_number: cleanedPhoneNumber,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Format the returned profile for display
      const formattedProfile = {
        ...data,
        phone_number: data.phone_number ? formatPhoneNumber(data.phone_number) : null
      };
      
      setProfile(formattedProfile);
      return formattedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: {
    username?: string;
    phone_number?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      // Validate phone number if provided
      if (updates.phone_number && !validatePhoneNumber(updates.phone_number)) {
        throw new Error('Please enter a valid 10-digit Indian phone number');
      }

      // Clean phone number for storage
      const updateData = { ...updates };
      if (updateData.phone_number) {
        updateData.phone_number = updateData.phone_number.replace(/\D/g, '');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('ser_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Format the returned profile for display
      const formattedProfile = {
        ...data,
        phone_number: data.phone_number ? formatPhoneNumber(data.phone_number) : null
      };
      
      setProfile(formattedProfile);
      return formattedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update phone number specifically
  const updatePhoneNumber = async (phoneNumber: string) => {
    return updateProfile({ phone_number: phoneNumber });
  };

  // Update username specifically
  const updateUsername = async (username: string) => {
    return updateProfile({ username });
  };

  // Check if phone number is required and not set
  const isPhoneNumberRequired = (): boolean => {
    return !profile?.phone_number;
  };

  // Sync Clerk user with profile (without relying on Clerk phone number)
  const syncProfile = async () => {
    if (!user) return;

    try {
      const existingProfile = await getProfile();
      if (!existingProfile) {
        // Create profile with email-based username if doesn't exist
        const username = user.username || 
                        user.fullName || 
                        user.primaryEmailAddress?.emailAddress.split('@')[0] || 
                        `user_${user.id.slice(-8)}`;
        
        await createProfile({
          username: username,
          phone_number: null, // Phone number will be collected separately
        });
      }
    } catch (err) {
      console.error('Failed to sync profile:', err);
    }
  };

  // Validate profile data before submission
  const validateProfileData = (profileData: {
    username?: string;
    phone_number?: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (profileData.username && profileData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (profileData.phone_number && !validatePhoneNumber(profileData.phone_number)) {
      errors.push('Please enter a valid 10-digit Indian phone number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Format phone number for display
  const getFormattedPhoneNumber = (): string | null => {
    return profile?.phone_number ? formatPhoneNumber(profile.phone_number) : null;
  };

  // Get raw phone number (without formatting)
  const getRawPhoneNumber = (): string | null => {
    return profile?.phone_number ? profile.phone_number.replace(/\D/g, '') : null;
  };

  useEffect(() => {
    if (user) {
      getProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  return {
    profile,
    loading,
    error,
    getProfile,
    createProfile,
    updateProfile,
    updatePhoneNumber,
    updateUsername,
    syncProfile,
    isPhoneNumberRequired,
    validateProfileData,
    getFormattedPhoneNumber,
    getRawPhoneNumber,
    refetch: getProfile,
  };
};