import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";

export interface SearchFilters {
    categories?: string[];
    sizes?: string[];
    colors?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    page?: number;
    limit?: number;
}

export interface SearchResult {
    id: string;
    name: string;
    description: string;
    slug: string;
    base_price: number;
    category_id: string;
    category_name: string;
    category_slug: string;
    variants: Array<{
        id: string;
        size: string;
        color: string;
        sku: string;
        price_adjustment: number;
        stock_quantity: number;
        is_available: boolean;
        final_price: number;
    }>;
    images: Array<{
        id: string;
        object_path: string;
        view_type: string;
        alt_text: string;
        is_primary: boolean;
    }>;
    relevance: number;
}

export interface SearchResponse {
    products: SearchResult[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    aggregations: Array<{
        category_id: string;
        category_name: string;
        category_count: number;
        sizes: string[];
        colors: string[];
        min_price: number;
        max_price: number;
    }>;
}

export interface SuggestionItem {
    suggestion_type: 'product' | 'category' | 'color'; // Updated
    value: string;
    metadata?: {
        id?: string;
        slug?: string;
        category?: string;
        product_count?: number;
    };
}

export interface SuggestionsResponse {
    suggestions: SuggestionItem[];
}

export const useSearch = (query: string, filters: SearchFilters = {}) => {
    const debouncedQuery = useDebounce(query, 300);
    return useQuery({
        queryKey: ['search', debouncedQuery, filters],
        queryFn: async (): Promise<SearchResponse> => {
            const params = new URLSearchParams();
            if(debouncedQuery) params.append('q', debouncedQuery);
            if (filters.categories?.length) params.append('categories', filters.categories.join(','));
            if (filters.sizes?.length) params.append('sizes', filters.sizes.join(','));
            if (filters.colors?.length) params.append('colors', filters.colors.join(','));
            if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.inStockOnly !== undefined) params.append('inStockOnly', filters.inStockOnly.toString());

            console.log('Search API called with:', params.toString());

            const res = await fetch(`/api/search?${params}`);
            if(!res.ok) {
                const errorText = await res.text();
                console.error('Search API error:', errorText);
                throw new Error('Search failed');
            }
            return res.json();
        },
        enabled: debouncedQuery.length >= 2 || Object.keys(filters).length > 0,
        staleTime: 5*60*1000,
    });
};

export const useSearchSuggestions = (query: string) => {
    const debouncedQuery = useDebounce(query, 200);
    return useQuery({
        queryKey: ['search-suggestions', debouncedQuery],
        queryFn: async (): Promise<SuggestionsResponse> => {
            if(!debouncedQuery || debouncedQuery.length < 2) {
                return { suggestions: [] };
            }

            console.log('Fetching suggestions for:', debouncedQuery);

            const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
            
            if(!res.ok) {
                const errorText = await res.text();
                console.error('Suggestions API error:', errorText);
                throw new Error('Suggestions failed');
            }
            
            const data = await res.json();
            console.log('Suggestions received:', data);
            return data;
        },
        enabled: debouncedQuery.length >= 2,
    });
};