import { Address, AddressType, CreateAddressInput } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

export function useAddresses() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all addresses
  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/addresses');

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch addresses';
      setError(errorMessage);
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Create new address
  const createAddress = useCallback(async (
    addressData: CreateAddressInput
  ): Promise<Address | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create address');
      }

      const data = await response.json();
      
      // Refresh addresses list
      await fetchAddresses();
      
      return data.address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create address';
      setError(errorMessage);
      console.error('Error creating address:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id, fetchAddresses]);

  // Update address
  const updateAddress = useCallback(async (
    addressId: string,
    updates: Partial<CreateAddressInput>
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update address');
      }

      // Refresh addresses list
      await fetchAddresses();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update address';
      setError(errorMessage);
      console.error('Error updating address:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, fetchAddresses]);

  // Delete address
  const deleteAddress = useCallback(async (addressId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }

      // Refresh addresses list
      await fetchAddresses();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address';
      setError(errorMessage);
      console.error('Error deleting address:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [user?.id, fetchAddresses]);

  // Set default address
  const setDefaultAddress = useCallback(async (addressId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/account/addresses/default', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address_id: addressId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }

      // Refresh addresses list
      await fetchAddresses();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default address';
      setError(errorMessage);
      console.error('Error setting default address:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, fetchAddresses]);

  // Get address by ID (from cached list)
  const getAddressById = useCallback((addressId: string): Address | undefined => {
    return addresses.find(addr => addr.id === addressId);
  }, [addresses]);

  // Get addresses by type
  const getAddressesByType = useCallback((type: AddressType): Address[] => {
    return addresses.filter(addr => 
      addr.address_type === type || addr.address_type === 'both'
    );
  }, [addresses]);

  // Get default address
  const getDefaultAddress = useCallback((type?: AddressType): Address | null => {
    if (!type) {
      return addresses.find(addr => addr.is_default) || null;
    }
    
    return addresses.find(addr => 
      addr.is_default && (addr.address_type === type || addr.address_type === 'both')
    ) || null;
  }, [addresses]);

  // Validate address data client-side
  const validateAddress = useCallback((
    addressData: CreateAddressInput
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!addressData.full_name?.trim()) {
      errors.push('Full name is required');
    }

    if (!addressData.phone_number?.trim()) {
      errors.push('Phone number is required');
    } else {
      const cleanPhone = addressData.phone_number.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        errors.push('Phone number must be 10 digits');
      }
      if (!/^[6-9]/.test(cleanPhone)) {
        errors.push('Phone number must start with 6, 7, 8, or 9');
      }
    }

    if (!addressData.address_line1?.trim()) {
      errors.push('Address line 1 is required');
    }

    if (!addressData.city?.trim()) {
      errors.push('City is required');
    }

    if (!addressData.state?.trim()) {
      errors.push('State is required');
    }

    if (!addressData.pincode?.trim()) {
      errors.push('Pincode is required');
    } else if (!/^\d{6}$/.test(addressData.pincode)) {
      errors.push('Pincode must be 6 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Computed values
  const defaultAddress = getDefaultAddress();
  const addressCount = addresses.length;
  const shippingAddresses = getAddressesByType('shipping');
  const billingAddresses = getAddressesByType('billing');

  // Auto-fetch on mount
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchAddresses();
    } else if (isUserLoaded && !user) {
      setAddresses([]);
    }
  }, [isUserLoaded, user, fetchAddresses]);

  return {
    // Data
    addresses,
    defaultAddress,
    addressCount,
    shippingAddresses,
    billingAddresses,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error
    error,
    
    // Methods
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAddressById,
    getAddressesByType,
    getDefaultAddress,
    validateAddress,
    
    // Convenience
    refetch: fetchAddresses
  };
}