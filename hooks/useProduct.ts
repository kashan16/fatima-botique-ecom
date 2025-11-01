/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useProduct.ts
import { supabase } from '@/lib/client';
import {
  ProductFilters,
  ProductImage,
  ProductSortOptions,
  ProductVariant,
  ProductWithDetails,
} from '@/types';
import { useCallback, useState } from 'react';

interface UseProductReturn {
  products: ProductWithDetails[];
  productDetails: ProductWithDetails | null;
  variants: ProductVariant[];
  images: ProductImage[];
  loading: boolean;
  error: string | null;

  // Read operations
  listProducts: (filters?: ProductFilters, sort?: ProductSortOptions) => Promise<ProductWithDetails[] | null>;
  getProductById: (id: string) => Promise<ProductWithDetails | null>;
  getProductBySlug: (slug: string) => Promise<ProductWithDetails | null>;
  searchProducts: (q: string) => Promise<ProductWithDetails[] | null>;
  getProductsByCategory: (categorySlug: string) => Promise<ProductWithDetails[] | null>;
  getVariantsForProduct: (productId: string) => Promise<ProductVariant[] | null>;
  getImagesForProduct: (productId: string) => Promise<ProductImage[] | null>;
  getRelatedProducts: (productId: string, limit?: number) => Promise<ProductWithDetails[]>;
  checkVariantAvailability: (variantId: string) => boolean;
  clearProductDetails: () => void;
}

export const useProduct = (): UseProductReturn => {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [productDetails, setProductDetails] = useState<ProductWithDetails | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to build base product query with variants and images
  const buildProductQuery = (filters?: ProductFilters, sort?: ProductSortOptions) => {
    let q = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        product_variants(*),
        product_images(*)
      `);

    if (filters) {
      if (filters.category_id) q = q.eq('category_id', filters.category_id);
      if (filters.is_active !== undefined) q = q.eq('is_active', filters.is_active);
      if (filters.min_price !== undefined) q = q.gte('base_price', filters.min_price);
      if (filters.max_price !== undefined) q = q.lte('base_price', filters.max_price);
    }

    const sortBy = sort?.sort_by || 'created_at';
    const ascending = sort?.order === 'asc';
    q = q.order(sortBy, { ascending });

    return q;
  };

  // Helper to transform database response to ProductWithDetails
  const transformToProductWithDetails = (data: any[]): ProductWithDetails[] => {
    return data.map(item => ({
      ...item,
      variants: item.product_variants || [],
      images: item.product_images || [],
      category: item.category
    }));
  };

  const listProducts = useCallback(async (filters?: ProductFilters, sort?: ProductSortOptions) => {
    setLoading(true);
    setError(null);
    try {
      const q = buildProductQuery(filters, sort);
      console.debug('[useProduct] listProducts', { filters, sort });
      
      const { data, error: fetchError } = await q;
      if (fetchError) throw fetchError;
      
      const productsWithDetails = transformToProductWithDetails(data || []);
      setProducts(productsWithDetails);
      return productsWithDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error listing products');
      console.error('listProducts error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductsByCategory = useCallback(async (categorySlug: string) => {
    setLoading(true);
    setError(null);
    try {
      // First get the category by slug
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (categoryError) throw categoryError;
      if (!category) throw new Error('Category not found');

      // Then get products for this category
      const { data, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          product_variants(*),
          product_images(*)
        `)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      
      const productsWithDetails = transformToProductWithDetails(data || []);
      setProducts(productsWithDetails);
      return productsWithDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching products by category');
      console.error('getProductsByCategory error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          product_variants(*),
          product_images(*)
        `)
        .eq('slug', slug)
        .single();

      if (productError) throw productError;

      const productWithDetails: ProductWithDetails = {
        ...product,
        variants: product.product_variants || [],
        images: product.product_images || [],
        category: product.category
      };

      setProductDetails(productWithDetails);
      setVariants(product.product_variants || []);
      setImages(product.product_images || []);

      return productWithDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching product by slug');
      console.error('getProductBySlug error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          product_variants(*),
          product_images(*)
        `)
        .eq('id', id)
        .single();

      if (productError) throw productError;

      const productWithDetails: ProductWithDetails = {
        ...product,
        variants: product.product_variants || [],
        images: product.product_images || [],
        category: product.category
      };

      setProductDetails(productWithDetails);
      setVariants(product.product_variants || []);
      setImages(product.product_images || []);

      return productWithDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching product by id');
      console.error('getProductById error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (qstr: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!qstr || !qstr.trim()) return [];
      
      const { data, error: searchError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          product_variants(*),
          product_images(*)
        `)
        .or(`name.ilike.%${qstr}%,description.ilike.%${qstr}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchError) throw searchError;
      
      const productsWithDetails = transformToProductWithDetails(data || []);
      setProducts(productsWithDetails);
      return productsWithDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error searching products');
      console.error('searchProducts error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the individual fetch functions for specific use cases
  const getVariantsForProduct = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size', { ascending: true });

      if (variantsError) throw variantsError;
      const arr: ProductVariant[] = data || [];
      setVariants(arr);
      return arr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching variants');
      console.error('getVariantsForProduct error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getImagesForProduct = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;
      const arr: ProductImage[] = data || [];
      setImages(arr);
      return arr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching images');
      console.error('getImagesForProduct error', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRelatedProducts = useCallback(async (productId: string, limit: number = 4) => {
    setLoading(true);
    setError(null);
    try {
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('category_id')
        .eq('id', productId)
        .single();

      if (pErr) throw pErr;
      const categoryId = prod?.category_id;
      if (!categoryId) return [];

      const { data, error: relatedError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          product_variants(*),
          product_images(*)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', productId)
        .limit(limit);

      if (relatedError) throw relatedError;
      
      return transformToProductWithDetails(data || []);
    } catch (err) {
      console.error('getRelatedProducts error', err);
      setError(err instanceof Error ? err.message : 'Error fetching related products');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const checkVariantAvailability = (variantId: string): boolean => {
    const v = variants.find((x) => x.id === variantId);
    return Boolean(v && v.is_available && v.stock_quantity > 0);
  };

  const clearProductDetails = () => {
    setProductDetails(null);
    setVariants([]);
    setImages([]);
    setError(null);
  };

  return {
    products,
    productDetails,
    variants,
    images,
    loading,
    error,
    listProducts,
    getProductById,
    getProductBySlug,
    searchProducts,
    getProductsByCategory,
    getVariantsForProduct,
    getImagesForProduct,
    getRelatedProducts,
    checkVariantAvailability,
    clearProductDetails,
  };
};

export default useProduct;