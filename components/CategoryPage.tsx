/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCart } from '@/hooks/useCart';
import { useCategory } from '@/hooks/useCategory';
import { useProduct } from '@/hooks/useProduct';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductSortOptions } from '@/types';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from './common/ProductCard';

// Skeleton Loader
const ProductCardSkeleton = () => (
    <Card className="overflow-hidden rounded-xl border border-gray-100 animate-pulse bg-white/80 backdrop-blur-sm">
        <div className="aspect-square w-full bg-gray-200" />
        <CardContent className="p-5">
            <div className="mb-3 h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-7 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-10 bg-gray-200 rounded w-full" />
        </CardContent>
    </Card>
);

// Price Filter Component
const PriceFilter = ({
    priceRange,
    onPriceChange,
    onClearPrice
}: {
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    onClearPrice: () => void;
}) => {
    const [localRange, setLocalRange] = useState<[number, number]>(priceRange);

    /*const handleRangeChange = (value: number[]) => {
        setLocalRange([value[0], value[1]]);
    };*/

    const applyPriceFilter = () => {
        onPriceChange(localRange);
    };

    const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < 10000;

    return (
        <div className="space-y-4 p-1">
            <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>₹{localRange[0].toLocaleString()}</span>
                    <span>₹{localRange[1].toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={localRange[0]}
                        onChange={(e) => setLocalRange([Number(e.target.value), localRange[1]])}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        placeholder="Min"
                    />
                    <span className="flex items-center text-gray-500">-</span>
                    <input
                        type="number"
                        value={localRange[1]}
                        onChange={(e) => setLocalRange([localRange[0], Number(e.target.value)])}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        placeholder="Max"
                    />
                    <Button 
                        onClick={applyPriceFilter}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Apply
                    </Button>
                </div>
            </div>
            
            {hasPriceFilter && (
                <Button
                    onClick={onClearPrice}
                    variant="outline"
                    size="sm"
                    className="w-full py-2 text-sm rounded-lg border border-gray-300"
                >
                    <X className="mr-2 h-3 w-3" />
                    Clear Price Filter
                </Button>
            )}
        </div>
    );
};

interface CategoryPageProps {
    categorySlug: string;
}

export const CategoryPage = ({ categorySlug }: CategoryPageProps) => {
    const router = useRouter();
    const { isSignedIn } = useUser();
    
    // Hooks
    const { 
        getProductsByCategory, 
        loading: productsLoading, 
        products 
    } = useProduct();
    const { 
        fetchCategoryBySlug, 
        loading: categoriesLoading 
    } = useCategory();
    const { addToCart, loading: cartLoading } = useCart();
    const { 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist, 
        loading: wishlistLoading 
    } = useWishlist();
    
    // State
    const [category, setCategory] = useState<any>(null);
    const [sortOption, setSortOption] = useState<ProductSortOptions>({
        sort_by: 'created_at',
        order: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    
    // Load category and products
    const loadCategoryData = useCallback(async () => {
        try {
            // Fetch category details
            const categoryData = await fetchCategoryBySlug(categorySlug);
            setCategory(categoryData);

            if (categoryData) {
                // Fetch products for this category
                await getProductsByCategory(categorySlug);
            }
        } catch (err) {
            console.error('Failed to load category data:', err);
            toast.error('Failed to load category');
        }
    }, [categorySlug, fetchCategoryBySlug, getProductsByCategory]);

    // Load data when component mounts or categorySlug changes
    useEffect(() => {
        loadCategoryData();
    }, [loadCategoryData]);

    // Filter products by price range
    const filteredProducts = products.filter(product => {
        const primaryVariant = product.variants?.[0];
        const finalPrice = Number(product.base_price || 0) + Number(primaryVariant?.price_adjustment || 0);
        return finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortOption.sort_by) {
            case 'name':
                return sortOption.order === 'asc' 
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            case 'price':
                const priceA = Number(a.base_price || 0) + Number(a.variants?.[0]?.price_adjustment || 0);
                const priceB = Number(b.base_price || 0) + Number(b.variants?.[0]?.price_adjustment || 0);
                return sortOption.order === 'asc' ? priceA - priceB : priceB - priceA;
            case 'created_at':
            default:
                return sortOption.order === 'asc' 
                    ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });

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
    
    const handlePriceRangeChange = (range: [number, number]) => {
        setPriceRange(range);
    };

    const handleClearPriceFilter = () => {
        setPriceRange([0, 10000]);
    };

    // Loading state
    const isLoading = productsLoading || categoriesLoading;
    
    return (
        <div className="min-h-screen relative">
            <div className="container mx-auto px-4 max-w-7xl py-8 relative z-10">
                {/* Header */}
                <div className="mb-12 text-center">
                    {category ? (
                        <>
                            <h1 className="text-4xl font-bold text-gray-800 mb-4 font-serif">
                                {category.name}
                            </h1>
                            {category.description && (
                                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                                    {category.description}
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="mb-8 flex items-center justify-between">
                    {/* Results Count */}
                    <div className="text-gray-700">
                        {isLoading ? 'Loading...' : `${sortedProducts.length} products found`}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <Select
                            value={`${sortOption.sort_by}-${sortOption.order}`}
                            onValueChange={(value) => {
                                const [sort_by, order] = value.split('-') as [ProductSortOptions['sort_by'], 'asc' | 'desc'];
                                setSortOption({ sort_by, order });
                            }}
                        >
                            <SelectTrigger className="w-[140px] border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-gray-50">
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
                            className="border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </div>

                {/* Full-width Filters Section */}
                {showFilters && (
                    <div className="mb-8 rounded-2xl bg-gray-50/80 backdrop-blur-sm p-8 border border-gray-200/50">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Filter Products</h3>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowFilters(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            
                            {/* Price Filter */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Price Range</h4>
                                <PriceFilter
                                    priceRange={priceRange}
                                    onPriceChange={handlePriceRangeChange}
                                    onClearPrice={handleClearPriceFilter}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Filters */}
                {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                    <div className="mb-8 flex flex-wrap gap-2 justify-center">
                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 border border-green-200">
                            Price: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                            <button
                                onClick={handleClearPriceFilter}
                                className="ml-2 text-green-500 hover:text-green-700"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    </div>
                )}

                {/* Products Grid */}
                <div className="container mx-auto px-4 max-w-6xl">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">No products found</h3>
                            <p className="text-gray-600 mb-6">
                                {priceRange[0] > 0 || priceRange[1] < 10000 
                                    ? "Try adjusting your price filters to see more products."
                                    : "No products available in this category at the moment."}
                            </p>
                            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                                <Button 
                                    onClick={handleClearPriceFilter} 
                                    variant="outline" 
                                    className="border-gray-300"
                                >
                                    Clear Price Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {sortedProducts.map((product) => (
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

export default CategoryPage;