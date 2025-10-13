import { UserProfile } from "@/types";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

interface MergedProfile {
  // From Clerk
  clerk_id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
    
  // From Supabase
  profile_id: string | null;
  username: string | null;
  phone_number: string | null;
  created_at: string | null;
  updated_at: string | null;
    
  // Computed
  has_complete_profile: boolean;
  missing_fields: string[];
}

export function useProfile() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [ profile, setProfile ] = useState<UserProfile | null>(null);
  const [ mergedProfile, setMergedProfile ] = useState<MergedProfile | null>(null);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  //fetch profile from API
  const fetchProfile = useCallback(async () => {
    if(!user?.id) return null;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/profile');
      if(!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if(data.exists && data.profile) {
        setProfile(data.profile);
      } else {
        setProfile(null);
        return null;
      }
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Error fetching profile : ', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id])

  //Initialize profile(create if doesn't exist)
  const initializeProfile = useCallback(async () => {
    if(user?.id) return null;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/profile/initialize', {
        method : 'POST'
      });

      if(!response.ok) {
        throw new Error('Failed to initialize profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      return data.profile;
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initilize profile';
      setError(errorMessage);
      console.error('Error initializing profile : ', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id])

const updateProfile = useCallback(async (updates: {
    username?: string;
    phone_number?: string;
  }): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      
      // Update merged profile
      if (mergedProfile) {
        setMergedProfile({
          ...mergedProfile,
          username: data.profile.username,
          phone_number: data.profile.phone_number,
          updated_at: data.profile.updated_at
        });
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      console.error('Error updating profile:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, mergedProfile]);

  // Update phone number specifically
  const updatePhoneNumber = useCallback(async (phoneNumber: string): Promise<boolean> => {
    return updateProfile({ phone_number: phoneNumber });
  }, [updateProfile]);

  // Update username specifically
  const updateUsername = useCallback(async (username: string): Promise<boolean> => {
    return updateProfile({ username });
  }, [updateProfile]);

  // Merge Clerk data with Supabase profile
  const mergProfileData = useCallback(() => {
    if (!user || !isClerkLoaded) {
      setMergedProfile(null);
      return;
    }

    const missingFields: string[] = [];
    if (!profile?.username) missingFields.push('username');
    if (!profile?.phone_number) missingFields.push('phone_number');

    const merged: MergedProfile = {
      // Clerk data
      clerk_id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      full_name: user.fullName,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.imageUrl,
      
      // Supabase data
      profile_id: profile?.id || null,
      username: profile?.username || null,
      phone_number: profile?.phone_number || null,
      created_at: profile?.created_at || null,
      updated_at: profile?.updated_at || null,
      
      // Computed
      has_complete_profile: missingFields.length === 0,
      missing_fields: missingFields
    };

    setMergedProfile(merged);
  }, [user, isClerkLoaded, profile]);

  // Check if phone number is required and not set
  const isPhoneNumberRequired = useCallback((): boolean => {
    return !profile?.phone_number;
  }, [profile]);

  // Validate profile data before submission
  const validateProfileData = useCallback((data: {
    username?: string;
    phone_number?: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.username !== undefined) {
      if (data.username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
      if (data.username.length > 30) {
        errors.push('Username must be less than 30 characters');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      }
    }

    if (data.phone_number !== undefined) {
      const cleanPhone = data.phone_number.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        errors.push('Phone number must be 10 digits');
      }
      if (!/^[6-9]/.test(cleanPhone)) {
        errors.push('Phone number must start with 6, 7, 8, or 9');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Auto-fetch profile when user loads
  useEffect(() => {
    if (isClerkLoaded && user) {
      fetchProfile();
    } else if (isClerkLoaded && !user) {
      setProfile(null);
      setMergedProfile(null);
    }
  }, [isClerkLoaded, user, fetchProfile]);

  // Merge data when profile or user changes
  useEffect(() => {
    mergProfileData();
  }, [mergProfileData]);

  return {
    // Data
    profile,
    mergedProfile,
    clerkUser: user,
    
    // Loading states
    isLoading,
    isClerkLoaded,
    
    // Error
    error,
    
    // Methods
    fetchProfile,
    initializeProfile,
    updateProfile,
    updatePhoneNumber,
    updateUsername,
    isPhoneNumberRequired,
    validateProfileData,
    
    // Convenience
    refetch: fetchProfile
  };  
}