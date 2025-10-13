// hooks/useCategory.ts
import { supabase } from '@/lib/client';
import { Category } from '@/types';
import { useCallback, useEffect, useState } from 'react'; // Added useCallback

export const useCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories
  const fetchAllCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching all categories:', errorMessage); // Log for debugging
      setCategories([]); // Ensure categories is empty on error
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active categories only - Memoized using useCallback
  const fetchActiveCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active categories';
      setError(errorMessage);
      console.error('Error fetching active categories:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category by ID - Memoized using useCallback
  const fetchCategoryById = useCallback(async (id: string): Promise<Category | null> => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category by ID';
      setError(errorMessage);
      console.error('Error fetching category by ID:', errorMessage);
      return null;
    }
  }, []);

  const fetchCategoryBySlug = useCallback(async (slug: string): Promise<Category | null> => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category by slug';
      setError(errorMessage);
      console.error('Error fetching category by slug:', errorMessage);
      return null;
    }
  }, []);
  const getCategoryTree = useCallback(async (): Promise<Category[]> => {
    try {
      setError(null);
      const allCategories = await fetchAllCategories();

      if (allCategories.length === 0) return [];

      const categoryMap = new Map<string, Category & { children?: Category[] }>();
      const rootCategories: (Category & { children?: Category[] })[] = [];

      allCategories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      allCategories.forEach(category => {
        if (category.parent_category_id && categoryMap.has(category.parent_category_id)) {
          const parent = categoryMap.get(category.parent_category_id);
          if (parent && parent.children) {
            parent.children.push(categoryMap.get(category.id)!);
          }
        } else if (!category.parent_category_id) {
          rootCategories.push(categoryMap.get(category.id)!);
        }
      });

      return rootCategories.filter(Boolean) as Category[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to build category tree';
      setError(errorMessage);
      console.error('Error building category tree:', errorMessage);
      return [];
    }
  }, [fetchAllCategories]);

  // Filter categories by parent - Memoized using useCallback
  const fetchCategoriesByParent = useCallback(async (parentId: string | null) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_category_id', parentId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch child categories';
      setError(errorMessage);
      console.error('Error fetching child categories:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch for all categories when the hook mounts
  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  return {
    categories,
    loading,
    error,
    fetchAllCategories,
    fetchActiveCategories,
    fetchCategoryById,
    fetchCategoryBySlug,
    getCategoryTree,
    fetchCategoriesByParent,
    refetch: fetchAllCategories,
  };
};