'use client';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ShadCN Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    ArrowRight,
    Heart,
    Loader2,
    Lock,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export const WishlistsPage = () => {
    const router = useRouter();
    const { isSignedIn } = useUser();
    const {
        wishlist,
        wishlistItems,
        wishlistCount,
        removeFromWishlist,
        loading: wishlistLoading,
        error: wishlistError,
    } = useWishlist();

    const {
        addToCart,
        loading: cartLoading,
    } = useCart();

    const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

    const safeImageSrc = (path?: string | null): string => {
        if (!path) return '/placeholder.png';
        const trimmed = path.trim();
        if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('/')) return trimmed;
        return `/${trimmed.replace(/^\/+/, '')}`;
    };

    if (!isSignedIn) {
        return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <Card className="p-8 text-center max-w-md shadow-lg bg-white/80 backdrop-blur-sm rounded-lg border border-white/20">
            <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-sans">Sign In Required</h2>
            <p className="text-gray-700 mb-6">Please sign in to view and manage your wishlist.</p>
            <Button
                onClick={() => router.push('/sign-in')}
                className="bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="mt-3 w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
            </Button>
            </Card>
        </div>
        );
    }

    if (wishlistLoading) {
        return (
        <div className="min-h-screen flex items-center justify-center relative">
            <Loader2 className="h-12 w-12 animate-spin text-gray-800" />
        </div>
        );
    }

    if (wishlistError) {
        return (
        <div className="min-h-screen py-12 relative">
            <div className="container mx-auto px-4">
            <Card className="p-8 text-center max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-red-200/50 shadow-sm rounded-lg">
                <h1 className="text-2xl font-bold text-red-800 mb-4 font-sans">Error Loading Wishlist</h1>
                <p className="text-gray-700 mb-6">{wishlistError}</p>
                <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                Try Again
                </Button>
            </Card>
            </div>
        </div>
        );
    }

    if (!wishlist || wishlistItems.length === 0) {
        return (
        <div className="min-h-screen py-12 relative">
            <div className="container mx-auto px-4">
            <Card className="p-12 text-center max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg">
                <Heart className="w-24 h-24 text-gray-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-800 mb-4 font-sans">Your Wishlist is Empty</h1>
                <p className="text-gray-700 mb-8 text-lg">Add some beautiful products to your wishlist to see them here.</p>
                <Link
                href="/"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-md font-semibold font-sans inline-flex items-center transition-colors text-base"
                >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Continue Shopping
                </Link>
            </Card>
            </div>
        </div>
        );
    }

    const handleRemoveItem = async (wishlistItemId: string) => {
        setUpdatingItems(prev => new Set(prev).add(wishlistItemId));
        try {
        await removeFromWishlist(wishlistItemId);
        toast.info("Item removed from wishlist.");
        } catch (error) {
        console.error('Failed to remove item:', error);
        toast.error("Failed to remove item from wishlist.");
        } finally {
        setUpdatingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(wishlistItemId);
            return newSet;
        });
        }
    };

    const handleMoveToCart = async (item: WishlistItemType) => {
        setUpdatingItems(prev => new Set(prev).add(item.id));
        try {
        // Add to cart
        await addToCart(item.product_variant_id, 1);
        // Remove from wishlist
        await removeFromWishlist(item.id);
        toast.success("Item moved to cart!");
        } catch (error) {
        console.error('Failed to move to cart:', error);
        toast.error("Failed to move item to cart.");
        } finally {
        setUpdatingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
        });
        }
    };

    const handleAddToCart = async (item: WishlistItemType) => {
        setUpdatingItems(prev => new Set(prev).add(item.id));
        try {
        await addToCart(item.product_variant_id, 1);
        toast.success("Item added to cart!");
        } catch (error) {
        console.error('Failed to add to cart:', error);
        toast.error("Failed to add item to cart.");
        } finally {
        setUpdatingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
        });
        }
    };

    type WishlistItemType = typeof wishlistItems[number];

    const WishlistItem = ({ item }: { item: WishlistItemType }) => {
        const productVariant = item.product_variant;
        const product = productVariant?.product;
        const primaryImage = productVariant?.images?.[0];
        
        const isUpdating = updatingItems.has(item.id);
        const isOutOfStock = !!productVariant && productVariant.stock_quantity === 0;
        const isLowStock = !!productVariant && productVariant.stock_quantity > 0 && productVariant.stock_quantity < 10;

        // Calculate final price
        const basePrice = product?.base_price || 0;
        const priceAdjustment = productVariant?.price_adjustment || 0;
        const finalPrice = basePrice + priceAdjustment;

        return (
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm mb-4 transition-all duration-200 hover:shadow-md">
            <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Product Image */}
                <div className="relative w-24 h-24 bg-gray-100/50 rounded-md overflow-hidden flex-shrink-0 border border-gray-200/50">
                {primaryImage ? (
                    <Image
                    src={safeImageSrc(primaryImage.object_path)}
                    alt={product?.name || 'Product image'}
                    fill
                    className="object-cover transition-opacity duration-300 ease-in-out hover:opacity-90"
                    sizes="96px"
                    onError={(e) => {
                        e.currentTarget.src = '/placeholder.png';
                    }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-1">
                    No Image
                    </div>
                )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-gray-800 text-lg font-sans line-clamp-2">
                    {product?.name || 'Unknown Product'}
                </h3>
                <p className="text-sm text-gray-700">
                    Size: {productVariant?.size} | Color: {productVariant?.color}
                </p>
                <p className="text-xl font-bold text-gray-800 font-sans">
                    ₹{finalPrice.toFixed(2)}
                </p>

                {isOutOfStock ? (
                    <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs mt-1 font-medium">
                    Out of Stock
                    </Badge>
                ) : isLowStock ? (
                    <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs mt-1 font-medium">
                    Only {productVariant?.stock_quantity} left!
                    </Badge>
                ) : null}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-auto">
                <Button
                    onClick={() => handleMoveToCart(item)}
                    disabled={isUpdating || cartLoading || isOutOfStock}
                    className="bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Move to Cart
                </Button>
                
                <Button
                    variant="outline"
                    onClick={() => handleAddToCart(item)}
                    disabled={isUpdating || cartLoading || isOutOfStock}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isUpdating}
                    className="h-9 w-9 text-gray-500 hover:text-red-500 hover:bg-gray-100/50 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
                </div>
            </div>
            </CardContent>
        </Card>
        );
    };

    return (
        <div className="min-h-screen py-12 relative">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight font-sans mb-4 sm:mb-0">Your Wishlist</h1>
            <Badge className="bg-gray-100/80 backdrop-blur-sm text-gray-800 border border-gray-200/50 text-lg px-4 py-2 rounded-full font-semibold font-sans">
                {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
            </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Wishlist Items */}
            <div className="lg:col-span-3">
                {wishlistItems.map((item) => (
                <WishlistItem key={item.id} item={item} />
                ))}
            </div>

            {/* Wishlist Summary */}
            <div className="lg:col-span-1">
                <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg sticky top-8">
                <CardHeader className="border-b border-gray-200/50 p-6">
                    <CardTitle className="text-2xl font-semibold text-gray-800 font-sans">Wishlist Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-700 text-base">
                        <span className="font-sans">Total Items</span>
                        <span className="font-semibold font-sans">{wishlistCount}</span>
                    </div>
                    
                    <Separator className="my-3 bg-gray-200/50" />
                    
                    <div className="text-sm text-gray-700">
                        <p className="mb-2">• Save items you love for later</p>
                        <p className="mb-2">• Get notified when prices drop</p>
                        <p className="mb-2">• Quickly move items to cart</p>
                        <p>• Share your wishlist with friends</p>
                    </div>
                    </div>

                    <Button
                    onClick={() => router.push('/')}
                    className="w-full bg-gray-800 text-white hover:bg-gray-700 transition-colors py-4 text-lg font-semibold rounded-md flex items-center justify-center"
                    >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Continue Shopping
                    </Button>

                    <Button
                    variant="outline"
                    onClick={() => router.push('/cart')}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-base font-semibold rounded-md flex items-center justify-center mt-3"
                    >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Cart
                    </Button>
                </CardContent>
                </Card>
            </div>
            </div>
        </div>
        </div>
    );
};