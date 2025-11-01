/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductCatalog.tsx
'use client';

import { useCart } from '@/hooks/useCart';
import { useCategory } from '@/hooks/useCategory';
import { useProduct } from '@/hooks/useProduct';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductFilters, ProductSortOptions, ProductWithDetails } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Filter, Heart, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

// Product Card Component
const ProductCard = ({ 
    product, 
    onProductClick, 
    onAddToCart, 
    onWishlistToggle,
    isInWishlist,
    isWishlistLoading,
    isCartLoading
}: { 
    product: ProductWithDetails;
    onProductClick: (slug: string) => void;
    onAddToCart: (e: React.MouseEvent, variantId: string) => void;
    onWishlistToggle: (e: React.MouseEvent, variantId: string) => void;
    isInWishlist: (variantId: string) => boolean;
    isWishlistLoading: boolean;
    isCartLoading: boolean;
}) => {
    const primaryVariant = product.variants?.[0];
    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
    
    if (!primaryVariant) {
        return null;
    }
    
    const safeImageSrc = (path?: string | null): string => {
        if (!path) return '/placeholder.png';
        const trimmed = path.trim();
        if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('/')) return trimmed;
        return `/${trimmed.replace(/^\/+/, '')}`;
    };
    
    const imageSrc = safeImageSrc(primaryImage?.object_path);
    const finalPrice = Number(product.base_price || 0) + Number(primaryVariant.price_adjustment || 0);
    const isCurrentlyWishlisted = isInWishlist(primaryVariant.id);
    const isOutOfStock = primaryVariant.stock_quantity === 0;
    
    return (
        <Card
            onClick={() => onProductClick(product.slug)}
            className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {imageSrc && imageSrc !== '/placeholder.png' ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={imageSrc}
                            alt={primaryImage?.alt_text || product.name || 'product image'}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = '/placeholder.png';
                                target.classList.remove('group-hover:scale-110');
                            }}
                            priority={false}
                            quality={85}
                        />
                    </div>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <div className="text-center text-gray-400">
                            <div className="mx-auto mb-2 rounded-full bg-gray-200 p-3">
                                <ShoppingCart className="h-6 w-6" />
                            </div>
                            <span className="text-sm">No image</span>
                        </div>
                    </div>
                )}
                
                {/* Wishlist Button */}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (primaryVariant) onWishlistToggle(e, primaryVariant.id);
                    }}
                    className="absolute right-3 top-3 bg-white/95 backdrop-blur-sm hover:bg-white shadow-md rounded-full"
                    disabled={isWishlistLoading || !primaryVariant || !isCurrentlyWishlisted}
                >
                    <Heart
                        className={`h-4 w-4 transition-all ${
                            primaryVariant && isInWishlist(primaryVariant.id)
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-600 hover:text-red-500'
                        }`}
                    />
                </Button>

                {/* Out of Stock Overlay */}
                {primaryVariant && primaryVariant.stock_quantity === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            <CardContent className="p-5">
                <h3 className="mb-3 line-clamp-2 font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>        
                
                <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-gray-900">₹{finalPrice.toFixed(2)}</p>
                    <Button
                        onClick={(e) => onAddToCart(e, primaryVariant.id)}
                        size="sm"
                        disabled={isCartLoading || isOutOfStock}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 py-2 transition-colors"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Skeleton Loader
const ProductCardSkeleton = () => (
    <Card className="overflow-hidden rounded-xl border border-gray-100 animate-pulse">
        <div className="aspect-square w-full bg-gray-200" />
        <CardContent className="p-5">
            <div className="mb-3 h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-7 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-10 bg-gray-200 rounded w-full" />
        </CardContent>
    </Card>
);

// Filter Sidebar Component
const FilterSidebar = ({
    categories,
    filters,
    onFiltersChange,
    onClearFilters,
    //isOpen,
}: {
    categories: any[];
    filters: ProductFilters;
    onFiltersChange: (filters: ProductFilters) => void;
    onClearFilters: () => void;
    isOpen: boolean;
    onClose: () => void;
}) => {
    const [priceRange, setPriceRange] = useState([0, 10000]);

    const handleCategoryChange = (categoryId: string) => {
        onFiltersChange({
            ...filters,
            category_id: categoryId === 'all' ? undefined : categoryId
        });
    };
    
    const handlePriceChange = (value: number[]) => {
        setPriceRange(value);
        onFiltersChange({
            ...filters,
            min_price: value[0],
            max_price: value[1]
        });
    };
    
    const hasActiveFilters = filters.category_id || filters.min_price || filters.max_price;

    return (
        <div className="space-y-8 p-1">
            {/* Categories */}
            <div>
                <Label className="mb-4 block text-lg font-semibold text-gray-900">Categories</Label>
                <div className="space-y-3">
                    <button
                        onClick={() => handleCategoryChange('all')}
                        className={`block w-full rounded-xl px-4 py-3 text-left text-base font-medium transition-all ${
                            !filters.category_id 
                            ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryChange(category.id)}
                            className={`block w-full rounded-xl px-4 py-3 text-left text-base font-medium transition-all ${
                                filters.category_id === category.id
                                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <Label className="mb-4 block text-lg font-semibold text-gray-900">Price Range</Label>
                <div className="space-y-6 px-2">
                    <Slider
                        value={priceRange}
                        onValueChange={handlePriceChange}
                        max={10000}
                        step={100}
                        className="w-full"
                    />
                    <div className="flex justify-between text-base font-medium text-gray-700">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full py-3 text-base rounded-xl border-2 border-gray-300 hover:border-gray-400"
                >
                    <X className="mr-3 h-5 w-5" />
                    Clear All Filters
                </Button>
            )}
        </div>
    );
};

export const ProductCatalog = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isSignedIn } = useUser();
    
    // Hooks
    const { listProducts, getProductsByCategory, loading: productsLoading } = useProduct();
    const { categories, loading: categoriesLoading } = useCategory();
    const { addToCart, loading: cartLoading } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
    
    // State
    const [products, setProducts] = useState<ProductWithDetails[]>([]);
    const [filters, setFilters] = useState<ProductFilters>({ is_active: true });
    const [sortOption, setSortOption] = useState<ProductSortOptions>({
        sort_by: 'created_at',
        order: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    //const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Build filters from URL
    useEffect(() => {
        const category = searchParams.get('category');
        const newFilters: ProductFilters = {
            ...(category && { category_id: category }),
            is_active: true
        };
        setFilters(newFilters);
    }, [searchParams]);

    // Load products
    const loadProducts = useCallback(async () => {
        try {
            let productsData;
            
            if (filters.category_id) {
                const category = categories.find(c => c.id === filters.category_id);
                if (category) {
                    productsData = await getProductsByCategory(category.slug);
                } else {
                    productsData = await listProducts(filters, sortOption);
                }
            } else {
                productsData = await listProducts(filters, sortOption);
            }
            
            if (!productsData) {
                setProducts([]);
                return;
            }

            setProducts(productsData);
        } catch (err) {
            console.error('Failed to load products:', err);
            toast.error('Failed to load products');
        }
    }, [filters, sortOption, listProducts, getProductsByCategory, categories]);
    
    // Load products when filters/sort change 
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);
    
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
            toast.success('Product added to cart!');
        } catch (err) {
            console.error('Failed to add to cart', err);
            toast.error('Failed to add product to cart');
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
                toast.success('Removed from wishlist');
            } else {
                await addToWishlist(productVariantId);
                toast.success('Added to wishlist');
            }
        } catch (err) {
            console.error('Error toggling wishlist item:', err);
            toast.error('Failed to update wishlist');
        }
    };
    
    const handleClearFilters = () => {
        setFilters({ is_active: true });
        router.push('/products');
    };

    // Loading state
    const isLoading = productsLoading || categoriesLoading;
    
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">Our Collection</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Discover carefully curated pieces crafted for your unique style
                    </p>
                </div>

                {/* Controls Bar - Minimal */}
                <div className="mb-8 flex items-center justify-between">
                    {/* Results Count */}
                    <div className="text-gray-600">
                        {isLoading ? 'Loading...' : `${products.length} products`}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        {/* Minimal Sort */}
                        <Select
                            value={`${sortOption.sort_by}-${sortOption.order}`}
                            onValueChange={(value) => {
                                const [sort_by, order] = value.split('-') as [ProductSortOptions['sort_by'], 'asc' | 'desc'];
                                setSortOption({ sort_by, order });
                            }}
                        >
                            <SelectTrigger className="w-[140px] border-gray-300 bg-white hover:bg-gray-50">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at-desc">Newest</SelectItem>
                                <SelectItem value="created_at-asc">Oldest</SelectItem>
                                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                <SelectItem value="name-asc">Name: A-Z</SelectItem>
                                <SelectItem value="name-desc">Name: Z-A</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filter Toggle Button */}
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="border-gray-300 bg-white hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </div>

                {/* Full-width Filters Section */}
                {showFilters && (
                    <div className="mb-8 rounded-2xl bg-gray-50 p-8 border border-gray-200">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Refine Your Search</h3>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowFilters(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <FilterSidebar
                                categories={categories}
                                filters={filters}
                                onFiltersChange={setFilters}
                                onClearFilters={handleClearFilters}
                                isOpen={true}
                                onClose={() => {}}
                            />
                        </div>
                    </div>
                )}

                {/* Active Filters */}
                <div className="mb-8 flex flex-wrap gap-2 justify-center">
                    {filters.category_id && (
                        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200">
                            {categories.find(c => c.id === filters.category_id)?.name}
                            <button
                                onClick={() => setFilters({...filters, category_id: undefined})}
                                className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {(filters.min_price || filters.max_price) && (
                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 border border-green-200">
                            Price: ₹{filters.min_price || 0} - ₹{filters.max_price || 10000}
                            <button
                                onClick={() => setFilters({...filters, min_price: undefined, max_price: undefined})}
                                className="ml-2 text-green-500 hover:text-green-700"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>

                {/* Products Grid - Centered */}
                <div className="flex justify-center">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md">
                            <div className="rounded-full bg-gray-100 p-6 mb-6">
                                <ShoppingCart className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">No products found</h3>
                            <p className="text-gray-600 mb-8">
                                Try adjusting your filters to find what you&apos;re looking for
                            </p>
                            <Button 
                                onClick={handleClearFilters}
                                variant="outline"
                                className="border-gray-300"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl">
                            {products.map((product) => (
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCatalog;