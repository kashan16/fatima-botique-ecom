import { ProductWithDetails } from '@/types';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Plus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';

// Optimized Product Card Component
export const ProductCard = ({ 
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
    if (!primaryVariant) return null;
    
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
    
    return (
        <div className="flex flex-col rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
            {/* Image Card - Completely filled */}
            <Card 
                onClick={() => onProductClick(product.slug)}
                className="rounded-b-none border-b-0 border border-gray-100 bg-gray-50 p-0 m-0" // Added p-0 m-0 to remove any default spacing
            >
                <CardContent className="p-0 m-0 aspect-square relative overflow-hidden"> {/* Added overflow-hidden and m-0 */}
                    {imageSrc && imageSrc !== '/placeholder.png' ? (
                        <Image
                            src={imageSrc}
                            alt={primaryImage?.alt_text || product.name || 'product image'}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                            onError={(e) => {
                                e.currentTarget.src = '/placeholder.png';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-100 p-4">
                            <div className="rounded-full bg-blue-500/10 p-3">
                                <Plus className="w-8 h-8 text-blue-500" />
                            </div>
                            <span className="text-sm">No image available</span>
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onWishlistToggle(e, primaryVariant.id);
                            }}
                            className="bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-200"
                            aria-label={isCurrentlyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            disabled={isWishlistLoading}
                        >
                            <Heart
                                className={`w-4 h-4 transition-all duration-200 ${
                                    isCurrentlyWishlisted 
                                    ? 'fill-red-500 text-red-500 scale-110' 
                                    : 'text-gray-700 hover:text-red-500'
                                }`}
                            />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Product Info Card */}
            <Card 
                onClick={() => onProductClick(product.slug)}
                className="rounded-t-none border-t-0 border border-gray-100 bg-white p-0 m-0" // Added p-0 m-0
            >
                <CardContent className="p-4 flex flex-col gap-2">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2 font-sans tracking-tight">
                        {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                        <p className="text-xl font-bold text-gray-900 font-sans tracking-tight">
                            ₹{finalPrice.toFixed(2)}
                        </p>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(e, primaryVariant.id);
                            }}
                            size="sm"
                            disabled={isCartLoading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};