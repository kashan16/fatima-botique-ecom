// hooks/useOrderHistory.ts

'use client';

import { supabase } from '@/lib/client';
import type { OrderFilters, OrderWithDetails } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';

export type OrderHistoryResult = {
    orders: OrderWithDetails[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number | null;
    hasMore: boolean;
    //action
    fetchPage: (page?: number) => Promise<OrderWithDetails[]>;
    loadMore: () => Promise<OrderWithDetails[]>;
    refresh: () => Promise<OrderWithDetails[]>;
    reset: () => void;
    setFilters: (filters: Partial<OrderFilters>) => void;
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function useOrderHistory(initialPageSize = DEFAULT_PAGE_SIZE, initialFilters: Partial<OrderFilters> = {}): OrderHistoryResult {
    const { userId, isLoaded: authLoaded } = useAuth();
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(Math.min(initialPageSize, MAX_PAGE_SIZE));
    const [total, setTotal] = useState<number | null>(null);
    const [filters, setFiltersState] = useState<Partial<OrderFilters>>(initialFilters);

    // Abort controller to cancel in-flight requests when params change
    const abortRef = useRef<AbortController | null>(null);

    const ensureAuth = useCallback(() => {
        if(!authLoaded) throw new Error('Auth not ready');
        if(!userId) throw new Error('User not authenticated');
    }, [authLoaded, userId]);

    const buildQuery = useCallback(() => {
        return supabase
        .from('orders')
        .select(`
            *,
            shipping_address:addresses!orders_shipping_address_id_fkey(*),
            billing_address:addresses!orders_billing_address_id_fkey(*),
            order_items(*, product_variant:product_variants(*, product:products(*))),
            order_payments(*),
            order_status_history(*)
        `, { count: 'exact' }); // Move count option here
    },[]);

    const fetchPage = useCallback(async (requestedPage = page): Promise<OrderWithDetails[]> => {
        try {
            ensureAuth();
            setLoading(true);
            setError(null);

            // cancel previous request if exists
            if(abortRef.current) {
                abortRef.current.abort();
            }
            const controller = new AbortController();
            abortRef.current = controller;

            const from = (requestedPage - 1) * pageSize;
            const to = from + pageSize - 1;

            let q = buildQuery()
            .eq('user_id', userId!)
            .order('created_at', {ascending : false })
            .range(from,to);

            // apply filters
            if (filters?.status) q = q.eq('order_status', filters.status);
            if (filters?.payment_status) q = q.eq('payment_status', filters.payment_status);
            if (filters?.date_from) q = q.gte('created_at', filters.date_from);
            if (filters?.date_to) q = q.lte('created_at', filters.date_to);

            // Execute the query directly - remove the .request() call
            const { data, error: fetchError, count } = await q;

            // Check if the request was aborted
            if (controller.signal.aborted) {
                return [];
            }

            if(fetchError) {
                throw fetchError;
            }

            const fetched = (data || []) as OrderWithDetails[];

            setOrders(prev => {
                // if requestedPage === 1 we replace, otherwise append (load more)
                if(requestedPage === 1) return fetched;
                const ids = new Set(prev.map(p => p.id));
                const merged = [...prev, ...fetched.filter(f => !ids.has(f.id))];
                return merged;
            });

            setPage(requestedPage);
            setTotal(typeof count === 'number' ? count : (fetched.length < pageSize && requestedPage === 1 ? fetched.length : null));

            return fetched;
        } catch(err) {
            // Check if the error is due to abort
            if (err === 'AbortError') {
                return [];
            }
            
            console.error('fetchPage error', err);
            setError(err instanceof Error ? err.message : String(err));
            return [];
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }, [ensureAuth, buildQuery, page, pageSize, filters, userId]);

    const loadMore = useCallback(async (): Promise<OrderWithDetails[]> => {
        // if total is known and we've loaded all, no-op
        if(total !== null && orders.length >= total) {
            return []
        }
        const next = page + 1;
        return fetchPage(next);
    }, [fetchPage, page, orders.length, total]);

    const refresh = useCallback(async (): Promise<OrderWithDetails[]> => {
        //reset to first page and refersh
        setOrders([]);
        setPage(1);
        return fetchPage(1);
    }, [fetchPage]);

    const reset = useCallback(() => {
        setOrders([]);
        setPage(1);
        setPageSize(initialPageSize);
        setTotal(null);
        setError(null);
    }, [initialPageSize]);

    // setter for filters with reset behavior (useful when user changes filters)
    const setFilters = useCallback((next: Partial<OrderFilters>) => {
        setFiltersState(next);
        // whenever filters change, reset list and fetch page 1
        setOrders([]);
        setPage(1);
        setTotal(null);
        // fire-and-forget
        void fetchPage(1);
    }, [fetchPage]);

    // auto-load first page when auth becomes ready or pageSize changes
    useEffect(() => {
        if (!authLoaded) return;
        if (!userId) {
            setOrders([]);
            return;
        }
        
        // initial fetch
        void fetchPage(1);
        
        // cleanup abort on unmount
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [authLoaded, userId, pageSize, fetchPage]);
  
    // convenience: compute hasMore
    const hasMore = total === null ? orders.length >= page * pageSize : orders.length < (total ?? 0);

    return {
        orders,
        loading,
        error,
        page,
        pageSize,
        total,
        hasMore,
        fetchPage,
        loadMore,
        refresh,
        reset,
        setFilters,
    };
}