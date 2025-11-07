// components/MainPage.tsx
'use client';

import { useCart } from '@/hooks/useCart';
import useProduct from '@/hooks/useProduct';
import { useWishlist } from '@/hooks/useWishlist';
import { Category, Product, ProductWithDetails } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from './common/ProductCard';

const ProductCardSkeleton = () => (
  <Card className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white/80 backdrop-blur-sm animate-pulse">
    <div className="aspect-square w-full bg-gray-200 rounded-t-xl" />
    <CardContent className="p-4 flex flex-col gap-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="h-10 bg-gray-200 rounded w-full mt-3" />
    </CardContent>
  </Card>
);

export const MainPage = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();

  // Product hooks
  const {
    listProducts,
    getVariantsForProduct,
    getImagesForProduct,
    loading: productDataLoading,
  } = useProduct();

  // Updated wishlist hook usage
  const { 
    isInWishlist, 
    addToWishlist,
    removeFromWishlist,
    loading: wishlistLoading
  } = useWishlist();

  // Updated cart hook usage
  const { 
    addToCart, 
    loading: cartLoading
  } = useCart();

  const [newArrivals, setNewArrivals] = useState<ProductWithDetails[]>([]);
  const [loadingInitialProducts, setLoadingInitialProducts] = useState(true);

  // Memoized product data fetching
  const buildProductDetails = useMemo(() => {
    return async (baseProducts: Product[]) => {
      const slice = baseProducts.slice(0, 4); // Only need 8 for new arrivals now

      const enriched = await Promise.allSettled(
        slice.map(async (p) => {
          try {
            const [variants, images] = await Promise.all([
              getVariantsForProduct(p.id).catch(() => []),
              getImagesForProduct(p.id).catch(() => []),
            ]);
            return {
              ...p,
              variants: variants || [],
              images: images || [],
            } as ProductWithDetails;
          } catch (err) {
            console.error('Error enriching product', p.id, err);
            const minimalCategory: Category = {
              id: p.category_id,
              name: 'Error Category',
              slug: 'error',
              description: null,
              created_at: new Date().toISOString(),
              parent_category_id: null,
              is_active: true
            };
            return {
              ...p,
              variants: [],
              images: [],
              category: minimalCategory,
            } as ProductWithDetails;
          }
        })
      );

      return enriched
        .filter((result): result is PromiseFulfilledResult<ProductWithDetails> => 
          result.status === 'fulfilled' && !!result.value
        )
        .map(result => result.value);
    };
  }, [getVariantsForProduct, getImagesForProduct]);

  // Optimized initial data loading
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!mounted) return;
      
      setLoadingInitialProducts(true);
      try {
        const baseProducts = (await listProducts({ is_active: true })) || [];
        
        if (!mounted) return;

        const enriched = await buildProductDetails(baseProducts);
        
        if (!mounted) return;

        setNewArrivals(enriched); // Just set new arrivals
      } catch (err) {
        console.error('Failed to load initial products for main page:', err);
        if (mounted) {
          toast.error('Failed to load products. Please try again.');
        }
      } finally {
        if (mounted) setLoadingInitialProducts(false);
      }
    };

    if (isClerkLoaded) {
      loadInitialData();
    }

    return () => {
      mounted = false;
    };
  }, [isClerkLoaded, listProducts, buildProductDetails]);

  // Event handlers
  const handleProductClick = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, productVariantId: string) => {
    e.stopPropagation();
    
    if (!isSignedIn) {
      toast.info('Please sign in to add items to your cart.');
      router.push('/sign-in');
      return;
    }

    try {
      await addToCart(productVariantId, 1);
      // Success toast is handled by the hook
    } catch (err) {
      // Error toast is handled by the hook
      console.error('Failed to add to cart', err);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent, productVariantId: string) => {
    e.stopPropagation();
    
    if (!isSignedIn) {
      toast.info('Please sign in to manage your wishlist.');
      router.push('/sign-in');
      return;
    }

    try {
      if (isInWishlist(productVariantId)) {
        await removeFromWishlist(productVariantId);
      } else {
        await addToWishlist(productVariantId);
      }
      // Success/error toast is handled by the hook
    } catch (err) {
      // Error toast is handled by the hook
      console.error('Error toggling wishlist item:', err);
    }
  };

  // Derived loading state
  const overallLoading = !isClerkLoaded || loadingInitialProducts || productDataLoading;

  if (overallLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-700 p-8 relative z-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4" />
        <p className="text-lg font-medium">Loading your boutique experience...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 font-sans relative">
      {/* Hero Section - Now with transparent background */}
      <section className="py-24 text-center relative">
        {/* Optional: Add a subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] -z-10"></div>
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight text-gray-900 font-serif">
            Unveiling Elegance
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Discover meticulously curated products crafted for your refined taste.
          </p>
          <Button
            onClick={() => router.push('/products')}
            className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-700 transition-colors duration-300 hover:scale-105"
          >
            Explore Collections
          </Button>
        </div>
      </section>

      {/* New Arrivals Section - With glass morphism effect */}
      <section className="py-16 relative">
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm -z-10"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif">New Arrivals</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Fresh styles just landed. Be the first to explore our latest collection.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {loadingInitialProducts ? (
              Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : newArrivals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Plus className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-700 text-lg mb-4">No new arrivals found.</p>
                <Button
                  onClick={() => router.push('/products')}
                  variant="outline"
                  className="border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Browse All Products
                </Button>
              </div>
            ) : (
              newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  onWishlistToggle={handleWishlistToggle}
                  isInWishlist={isInWishlist}
                  isWishlistLoading={wishlistLoading}
                  isCartLoading={cartLoading}
                />
              ))
            )}
          </div>

          {/* View More Button */}
          {newArrivals.length > 0 && (
            <div className="text-center mt-12">
              <Button
                onClick={() => router.push('/products')}
                variant="outline"
                className="border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-500 px-8 py-2"
              >
                View All Products
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MainPage;