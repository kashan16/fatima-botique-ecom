import { supabase } from '@/lib/client';
import { Address, AddressType, CreateAddressInput } from '@/types';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export const useAddresses = () => {
  const { user } = useUser();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all addresses
  const fetchAddresses = async () => {
    if (!user) return [];

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses by type
  const fetchAddressesByType = async (type: AddressType) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .or(`address_type.eq.${type},address_type.eq.both`)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses by type');
      return [];
    }
  };

  // Create new address
  const createAddress = async (addressData: CreateAddressInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      // If setting as default, unset other defaults of same type
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .or(`address_type.eq.${addressData.address_type},address_type.eq.both`);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([{ ...addressData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      await fetchAddresses(); // Refresh list
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create address');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update address
  const updateAddress = async (addressId: string, updates: Partial<CreateAddressInput>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      // If setting as default, unset other defaults
      if (updates.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', addressId)
          .or(`address_type.eq.${updates.address_type},address_type.eq.both`);
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      await fetchAddresses(); // Refresh list
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete address
  const deleteAddress = async (addressId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAddresses(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId: string, addressType: AddressType) => {
    return updateAddress(addressId, { is_default: true, address_type: addressType });
  };

  // Get default address by type
  const getDefaultAddress = async (type: AddressType): Promise<Address | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .or(`address_type.eq.${type},address_type.eq.both`)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get default address');
      return null;
    }
  };

  // Validate address data
  const validateAddress = (addressData: CreateAddressInput): string | null => {
    if (!addressData.full_name?.trim()) return 'Full name is required';
    if (!addressData.phone_number?.trim()) return 'Phone number is required';
    if (!addressData.address_line1?.trim()) return 'Address line 1 is required';
    if (!addressData.city?.trim()) return 'City is required';
    if (!addressData.state?.trim()) return 'State is required';
    if (!addressData.pincode?.trim()) return 'Pincode is required';
    
    // Basic phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(addressData.phone_number.replace(/\D/g, ''))) {
      return 'Please enter a valid phone number';
    }

    // Basic pincode validation
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(addressData.pincode)) {
      return 'Please enter a valid 6-digit pincode';
    }

    return null;
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    fetchAddressesByType,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    validateAddress,
    refetch: fetchAddresses,
  };
};