'use client';

import { supabase } from '@/lib/client';
import type { Address, CreateAddressInput } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

//Return shape for useAddresses

export interface UseAddressesReturn {
  addresses: Address[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAddresses: () => Promise<Address[]>;
  createAddress: (payload: CreateAddressInput) => Promise<Address>;
  updateAddress: (id: string, payload: Partial<CreateAddressInput>) => Promise<Address>;
  setDefaultAddress: (id:string) => Promise<void>;
  deleteAddress: (id: string, soft?: boolean) => Promise<void>;
  refresh: () => Promise<Address[]>;
}


/**
 * Hook for CRUD operations on the addresses table.
 *
 * - Uses Clerk's userId for scoping (RLS should be enabled server-side).
 * - Soft-deletes by default (sets deleted_at).
 */

export function useAddresses() : UseAddressesReturn {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [ addresses, setAddresses ] = useState<Address[]>([]);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  const ensureAuth = useCallback(() => {
    if(!authLoaded) throw new Error('Auth not ready');
    if(!userId) throw new Error('User not authenticated');
  }, [authLoaded, userId]);

  const transformAddressRow = useCallback(( row : Address) : Address => {
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      full_name: row.full_name ?? '',
      phone_number: row.phone_number ?? '',
      address_line1: row.address_line1 ?? '',
      address_line2: row.address_line2 ?? undefined,
      landmark: row.landmark ?? undefined,
      city: row.city ?? '',
      state: row.state ?? '',
      pincode: row.pincode ?? '',
      address_type: (row.address_type ?? 'shipping') as Address['address_type'],
      is_default: Boolean(row.is_default),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      deleted_at: row.deleted_at ?? undefined,
      updated_by: row.updated_by ?? undefined,
    } as Address
  }, []);

  const fetchAddresses = useCallback(async () : Promise<Address[]> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('is_default', { ascending : false})
      .order('updated_at', { ascending : false });

      if(fetchError) {
        throw fetchError;
      }

      const rows = (data || []).map(transformAddressRow);
      setAddresses(rows);
      return rows;
    } catch(err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch addresses';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, transformAddressRow, userId]);

  const createAddress = useCallback(async (payload: CreateAddressInput): Promise<Address> => {
  try {
    ensureAuth();
    setLoading(true);
    setError(null);

    const required = ['full_name', 'phone_number', 'address_line1', 'city', 'state', 'pincode', 'address_type'];
    for (const key of required) {
      // @ts-expect-error dynamic key check
      if (!payload[key]) throw new Error(`${key} is required`);
    }

    // If new address is set as default, clear existing defaults first
    if (payload.is_default) {
      const { error: clearErr } = await supabase
        .from('addresses')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (clearErr) console.warn('Failed to clear previous default addresses', clearErr);
    }

    const insertPayload = {
      ...payload,
      user_id: userId,
    };

    const { data: created, error: insertError } = await supabase
      .from('addresses')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError || !created) {
      throw insertError ?? new Error('Failed to create address');
    }

    const normalized = transformAddressRow(created);
    setAddresses(prev => {
      if (normalized.is_default) {
        return [normalized, ...prev.map(a => ({ ...a, is_default: false }))];
      }
      return [normalized, ...prev];
    });
    return normalized;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create address';
    setError(msg);
    throw err;
  } finally {
    setLoading(false);
  }
}, [ensureAuth, transformAddressRow, userId]);


  const updateAddress = useCallback(async (id: string, payload: Partial<CreateAddressInput>): Promise<Address> => {
    try {
      ensureAuth();
      if(!id) throw new Error('Address id is required');
      setLoading(true);
      setError(null);

      if(payload.is_default === true) {
        const { error: clearErr } = await supabase
        .from('addresses')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null)

        if(clearErr) {
          console.warn('Failed to clear previous default addresses', clearErr);
        }
      }

      const { data: updated, error: updateError } = await supabase
      .from('addresses')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

      if(updateError || !updated) {
        throw updateError ?? new Error('Failed to update address');
      }
      const normalized = transformAddressRow(updated);
      setAddresses(prev => prev.map(a => (a.id === id ? normalized : a)));
      return normalized;
    } catch(err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete address';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  },[ensureAuth, transformAddressRow, userId]);

  const setDefaultAddress = useCallback(async (id: string) : Promise<void> => {
    try {    
      ensureAuth();
      if(!id) throw new Error('address id is required')
        setLoading(true);
      setError(null);

      // clear other defaults
      const { error : clearErr } = await supabase
      .from('addresses')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('deleted_at', null)
    
      if(clearErr) throw clearErr;

      // set target as default
      const { data: updated, error: setErr } = await supabase
      .from('addresses')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
      if (setErr || !updated) throw setErr ?? new Error('Failed to set default address');
    
      const normalized = transformAddressRow(updated);
      setAddresses(prev => prev.map(a => (a.id === id ? normalized : { ...a, is_default: false })));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to set default address';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  },[ensureAuth,transformAddressRow,userId]);

  const deleteAddress = useCallback(async (id: string, soft = true): Promise<void> => {
    try {
      ensureAuth();
      if (!id) throw new Error('address id is required');
      setLoading(true);
      setError(null);

      if (soft) {
        const now = new Date().toISOString();
        const { error: delErr } = await supabase
        .from('addresses')
        .update({ deleted_at: now, updated_at: now })
        .eq('id', id)
        .eq('user_id', userId);

        if (delErr) throw delErr;
        setAddresses(prev => prev.filter(a => a.id !== id));
      } else {
        const { error: deleteErr } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

        if (deleteErr) throw deleteErr;
        setAddresses(prev => prev.filter(a => a.id !== id));
      }
    } catch(err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete address';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId]);

  useEffect(() => {
    if(!authLoaded) return;
    if(!userId) {
      setAddresses([]);
      return;
    }
    void fetchAddresses()
  }, [authLoaded, userId, fetchAddresses]);

  const refresh = useCallback( async () => {
    return fetchAddresses();
  }, [fetchAddresses]);

  const visibleAddresses = useMemo(() => addresses.filter(a => !a.deleted_at), [addresses]);
  return {
    addresses: visibleAddresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    refresh,
  }
}