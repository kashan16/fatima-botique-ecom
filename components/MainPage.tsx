// components/MainPage.tsx
'use client';

import { useCart } from '@/hooks/useCart';
import useProduct from '@/hooks/useProduct';
import { useWishlist } from '@/hooks/useWishlist';
import { Category, Product, ProductWithDetails } from '@/types';
import { useUser } from '@clerk/nextjs';
import { easeOut, motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCategory } from '@/hooks/useCategory';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import HeroWindowCards from './common/HeroWindowCard';
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

const CategoryCardSkeleton = () => (
  <div className="flex-shrink-0 w-80 h-96 rounded-2xl bg-gray-200 animate-pulse" />
);

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easeOut
    }
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOut
    }
  }
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const MainPage = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Product hooks
  const {
    listProducts,
    getVariantsForProduct,
    getImagesForProduct,
    loading: productDataLoading,
  } = useProduct();

  // Category hook
  const {
    categories,
    loading: categoryLoading
  } = useCategory();

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mock hero images
  const heroImages = [
    {
      id: 1,
      src: '/HeroImage1.jpeg',
      alt: 'Luxury Collection',
      title: 'Spring Collection',
      subtitle: 'Fresh styles for the new season'
    },
    {
      id: 2,
      src: '/HeroImage2.jpeg',
      alt: 'Elegant Designs',
      title: 'Summer Essentials',
      subtitle: 'Light and comfortable'
    }
  ];

  // Check scroll position
  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 350; // Width of one card plus gap
      const newScrollLeft = direction === 'left' 
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Update scroll buttons on scroll
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollButtons);
      checkScrollButtons(); // Initial check
      
      return () => carousel.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  // Memoized product data fetching
  const buildProductDetails = useMemo(() => {
    return async (baseProducts: Product[]) => {
      const slice = baseProducts.slice(0, 4);

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
        const [baseProducts] = await Promise.all([
          listProducts({ is_active: true }) || [],
        ]);
        
        if (!mounted) return;

        const enriched = await buildProductDetails(baseProducts!);
        
        if (!mounted) return;

        setNewArrivals(enriched);
      } catch (err) {
        console.error('Failed to load initial data for main page:', err);
        if (mounted) {
          toast.error('Failed to load content. Please try again.');
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

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/category/${categorySlug}`);
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
    } catch (err) {
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
    } catch (err) {
      console.error('Error toggling wishlist item:', err);
    }
  };

  // Get category image with fallback to a default image
  const getCategoryImage = (category: Category) => {
    if (category.image_url) {
      return category.image_url;
    }
    return '/images/category-default.jpg';
  };

  // Derived loading state
  const overallLoading = !isClerkLoaded || loadingInitialProducts || productDataLoading;

  if (overallLoading) {
    return (
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center text-gray-700 p-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          className="text-lg font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading your boutique experience...
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen text-gray-900 font-sans relative overflow-hidden"
    >
      {/* Hero Section */}
      <section className="py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/95 to-blue-50/30 -z-20"></div>
        
        <motion.div 
          className="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-32 h-32 bg-pink-200/20 rounded-full blur-xl -z-10"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-16 h-16 bg-purple-200/15 rounded-full blur-lg -z-10"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight text-gray-900 font-serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Unveiling Elegance
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl mb-12 text-gray-700 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Discover meticulously curated products crafted for your refined taste.
          </motion.p>

          <HeroWindowCards heroImages={heroImages}/>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Button
              onClick={() => router.push('/products')}
              className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg hover:bg-gray-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl mt-8"
            >
              Explore Collections
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories Carousel Section */}
      <section className="py-20 relative bg-gradient-to-b from-gray-50/30 to-white">
        <motion.div 
          className="container mx-auto px-4 max-w-7xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Shop by Category
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Find exactly what you&apos;re looking for in our carefully organized collections
            </motion.p>
          </div>
          
          {categoryLoading ? (
            <div className="flex gap-6 overflow-x-hidden px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg">No categories found.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-gray-200"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
              )}

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-4 py-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    className="group relative flex-shrink-0 w-[350px] h-[450px] rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 bg-white"
                    onClick={() => handleCategoryClick(category.slug)}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8 }}
                  >
                    {/* Image Container with Next.js Image */}
                    <div className="relative w-full h-full">
                      <Image
                        src={getCategoryImage(category)}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="350px"
                        priority={index < 3}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                      
                      {/* Category Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-8">
                        <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                          <h3 className="text-3xl md:text-4xl font-bold text-white font-serif tracking-wide mb-3 drop-shadow-2xl">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-white/90 text-sm md:text-base line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                              {category.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Explore Button */}
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150 transform translate-y-4 group-hover:translate-y-0">
                          <span className="inline-flex items-center gap-2 text-white font-medium text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                            Explore Collection
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      
                      {/* Decorative Border on Hover */}
                      <div className="absolute inset-0 border-4 border-transparent group-hover:border-white/50 rounded-3xl transition-all duration-300" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-gray-200"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/20 to-gray-50/10 -z-20"></div>
        
        <motion.div 
          className="container mx-auto px-4 max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <motion.h2 
              className="text-4xl font-bold text-gray-900 mb-4 font-serif"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              New Arrivals
            </motion.h2>
            <motion.p 
              className="text-gray-700 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Fresh styles just landed. Be the first to explore our latest collection.
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            variants={staggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {loadingInitialProducts ? (
              Array.from({ length: 8 }).map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <ProductCardSkeleton />
                </motion.div>
              ))
            ) : newArrivals.length === 0 ? (
              <motion.div 
                className="col-span-full text-center py-12"
                variants={itemVariants}
              >
                <div className="text-gray-500 mb-4">
                  <Plus className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-700 text-lg mb-4">No new arrivals found.</p>
                <Button
                  onClick={() => router.push('/products')}
                  variant="outline"
                  className="border-gray-400 text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Browse All Products
                </Button>
              </motion.div>
            ) : (
              newArrivals.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onWishlistToggle={handleWishlistToggle}
                    isInWishlist={isInWishlist}
                    isWishlistLoading={wishlistLoading}
                    isCartLoading={cartLoading}
                  />
                </motion.div>
              ))
            )}
          </motion.div>

          {newArrivals.length > 0 && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                onClick={() => router.push('/products')}
                variant="outline"
                className="border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-500 px-8 py-2 rounded-xl"
              >
                View All Products
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Hide scrollbar globally for carousel */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default MainPage;