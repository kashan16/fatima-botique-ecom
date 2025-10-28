// hooks/useProfile.ts
'use client';

import { supabase } from '@/lib/client';
import type { UserProfile } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

export interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<UserProfile | null>;
  createProfile: (payload: { username?: string | null; phone_number?: string | null }) => Promise<UserProfile>;
  updateProfile: (payload: { username?: string | null; phone_number?: string | null }) => Promise<UserProfile>;
  deleteProfile: () => Promise<void>;
  refresh: () => Promise<UserProfile | null>;
}

/**
 * Robust hook for CRUD on user_profile table.
 * - Uses upsert for create/update to work reliably (requires unique index on user_id).
 * - Surfaces Supabase error.message/details in `error`.
 * - Does not attempt operations until auth is loaded and userId exists.
 */
export function useProfile(): UseProfileReturn {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ensureAuth = useCallback(() => {
    if (!authLoaded) throw new Error('Auth not ready');
    if (!userId) throw new Error('User not authenticated');
  }, [authLoaded, userId]);

  const normalizeRow = useCallback((row: UserProfile): UserProfile => {
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      username: row.username ?? null,
      phone_number: row.phone_number ?? null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }, []);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) {
        // Surface Supabase error details for easier debugging
        const msg = (fetchErr.message ?? JSON.stringify(fetchErr)) as string;
        setError(msg);
        throw fetchErr;
      }

      if (!data) {
        setProfile(null);
        return null;
      }

      const normalized = normalizeRow(data);
      setProfile(normalized);
      return normalized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, normalizeRow, userId]);

  /**
   * createProfile: inserts a new profile row.
   * We prefer upsert (onConflict: 'user_id') so if the row exists it will be returned/updated.
   * NOTE: upsert requires a UNIQUE constraint on user_profile.user_id (see SQL above).
   */
  const createProfile = useCallback(async (payload: { username?: string | null; phone_number?: string | null }): Promise<UserProfile> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);

      const insertObj = {
        user_id: userId,
        username: payload.username ?? null,
        phone_number: payload.phone_number ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data: created, error: insertErr } = await supabase
        .from('user_profile')
        // upsert will perform insert or update when conflict on user_id occurs
        .upsert(insertObj, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (insertErr) {
        console.error('Supabase insert error:', insertErr);
        setError(insertErr.message ?? JSON.stringify(insertErr));
        throw insertErr;
      }
      if (!created) {
        const msg = 'Failed to create profile: no row returned';
        setError(msg);
        throw new Error(msg);
      }

      const normalized = normalizeRow(created);
      setProfile(normalized);
      return normalized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, normalizeRow, userId]);

  /**
   * updateProfile: uses upsert to update or create when necessary.
   * This avoids the "profile missing" failure mode.
   */
  const updateProfile = useCallback(async (payload: { username?: string | null; phone_number?: string | null }): Promise<UserProfile> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);

      const upsertObj = {
        user_id: userId,
        username: payload.username ?? null,
        phone_number: payload.phone_number ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: upsertErr } = await supabase
        .from('user_profile')
        .upsert(upsertObj, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (upsertErr) {
        console.error('Supabase upsert error:', upsertErr);
        setError(upsertErr.message ?? JSON.stringify(upsertErr));
        throw upsertErr;
      }
      if (!updated) {
        const msg = 'Failed to update profile: no row returned';
        setError(msg);
        throw new Error(msg);
      }

      const normalized = normalizeRow(updated);
      setProfile(normalized);
      return normalized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, normalizeRow, userId]);

  const deleteProfile = useCallback(async (): Promise<void> => {
    try {
      ensureAuth();
      setLoading(true);
      setError(null);

      const { error: deleteErr } = await supabase
        .from('user_profile')
        .delete()
        .eq('user_id', userId);

      if (deleteErr) {
        console.error('Supabase delete error:', deleteErr);
        setError(deleteErr.message ?? JSON.stringify(deleteErr));
        throw deleteErr;
      }

      setProfile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete profile';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId]);

  // initial load once auth is ready
  useEffect(() => {
    if (!authLoaded) return;
    if (!userId) {
      setProfile(null);
      return;
    }
    void fetchProfile();
  }, [authLoaded, userId, fetchProfile]);

  const refresh = useCallback(async () => {
    return fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    refresh,
  };
}
