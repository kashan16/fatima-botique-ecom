'use client';
import { useCart } from '@/hooks/useCart';
import { useProduct } from '@/hooks/useProduct';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductImage, ProductVariant } from '@/types';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// ShadCN Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'sonner';

export const ProductsPage = () => {
  const router = useRouter();
  const params = useParams();
  const productSlug = params.productSlug as string;
  const { isSignedIn } = useUser();

  const {
    getProductBySlug,
    productDetails,
    loading,
    error: productError
  } = useProduct();

  const { addToCart, loading: cartLoading } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productSlug) return;

      const data = await getProductBySlug(productSlug);
      if (data && data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    };

    loadProduct();
  }, [productSlug, getProductBySlug]);

  useEffect(() => {
    setQuantity(1);
    setCurrentImageIndex(0);
    setImageLoading(true);
    if (productDetails && productDetails.variants.length > 0) {
      setSelectedVariant(productDetails.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [productDetails]);

  const availableSizes = useMemo(() => {
    if (!productDetails) return [];
    return Array.from(new Set(productDetails.variants?.map((v: ProductVariant) => v.size) || []));
  }, [productDetails]);

  const availableColors = useMemo(() => {
    if (!productDetails) return [];
    return Array.from(new Set(productDetails.variants?.map((v: ProductVariant) => v.color) || []));
  }, [productDetails]);

  const primaryImages = useMemo(() => {
    if (!productDetails) return [];
    // If we have specific view types, use front view first, then others
    const frontImages = productDetails.images?.filter((img: ProductImage) => img.view_type === 'front') || [];
    const otherImages = productDetails.images?.filter((img: ProductImage) => img.view_type !== 'front') || [];
    return [...frontImages, ...otherImages];
  }, [productDetails]);

  const handleSizeSelect = (size: string) => {
    if (!productDetails) return;
    let newVariant = productDetails.variants.find(
      (v: ProductVariant) => v.size === size && v.color === (selectedVariant?.color || availableColors[0])
    );
    if (!newVariant) {
      newVariant = productDetails.variants.find((v: ProductVariant) => v.size === size);
    }
    if (newVariant) {
      setSelectedVariant(newVariant);
    }
  };

  const handleColorSelect = (color: string) => {
    if (!productDetails) return;
    let newVariant = productDetails.variants.find(
      (v: ProductVariant) => v.color === color && v.size === (selectedVariant?.size || availableSizes[0])
    );
    if (!newVariant) {
      newVariant = productDetails.variants.find((v: ProductVariant) => v.color === color);
    }
    if (newVariant) {
      setSelectedVariant(newVariant);
    }
  };

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      toast.info('Please sign in to add items to your cart.');
      router.push('/sign-in');
      return;
    }

    if (!selectedVariant) {
      toast.error('Please select a product variant.');
      return;
    }

    if (selectedVariant.stock_quantity === 0) {
      toast.error('This item is out of stock.');
      return;
    }

    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success(`${quantity} x ${productDetails?.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!isSignedIn) {
      toast.info('Please sign in to proceed to checkout.');
      router.push('/sign-in');
      return;
    }

    if (!selectedVariant) {
      toast.error('Please select a product variant.');
      return;
    }

    if (selectedVariant.stock_quantity === 0) {
      toast.error('This item is out of stock.');
      return;
    }

    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success(`${quantity} x ${productDetails?.name} added to cart. Redirecting to checkout...`);
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to add to cart for buy now:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isSignedIn) {
      toast.info('Please sign in to manage your wishlist.');
      router.push('/sign-in');
      return;
    }

    if (!selectedVariant) {
      toast.error('No variant selected to add to wishlist.');
      return;
    }

    try {
      if (isInWishlist(selectedVariant.id)) {
        await removeFromWishlist(selectedVariant.id);
      } else {
        await addToWishlist(selectedVariant.id);
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const isWishlisted = useMemo(() => {
    return selectedVariant ? isInWishlist(selectedVariant.id) : false;
  }, [selectedVariant, isInWishlist]);

  const safeImageSrc = (path?: string | null): string => {
    if (!path) return '/placeholder.png';
    const trimmed = path.trim();
    if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `/${trimmed.replace(/^\/+/, '')}`;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Card className="p-8 text-center shadow-lg bg-white/80 backdrop-blur-sm rounded-lg border border-white/20">
          <h2 className="text-2xl font-semibold text-red-600 mb-4 font-sans">Error Loading Product</h2>
          <p className="text-gray-700 mb-6">{productError}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Button>
        </Card>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Card className="p-8 text-center shadow-lg bg-white/80 backdrop-blur-sm rounded-lg border border-white/20">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-sans">Product Not Found</h2>
          <Button
            onClick={() => router.push('/')}
            className="bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Button>
        </Card>
      </div>
    );
  }

  const finalPrice = selectedVariant
    ? productDetails.base_price + selectedVariant.price_adjustment
    : productDetails.base_price;

  return (
    <div className="min-h-screen py-12 relative">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 lg:p-12">
            {/* Image Gallery - Fixed Size Container */}
            <div className="space-y-6">
              {/* Main Image Container - Fixed Size */}
              <div className="relative h-[500px] w-full bg-gray-100/50 rounded-lg overflow-hidden border border-gray-200/50 flex items-center justify-center">
                {primaryImages.length > 0 ? (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                      </div>
                    )}
                    <Image
                      src={safeImageSrc(primaryImages[currentImageIndex]?.object_path)}
                      alt={productDetails.name}
                      width={500}
                      height={500}
                      className={`object-contain w-full h-full transition-opacity duration-300 ${
                        imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      priority={currentImageIndex === 0}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
                    <Plus className="w-16 h-16 text-gray-400" />
                    <span className="text-sm text-gray-600 mt-2 font-sans">No image available</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images - Fixed Size */}
              {primaryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {primaryImages.map((image: ProductImage, index: number) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setImageLoading(true);
                      }}
                      className={`relative h-24 w-full bg-gray-100/50 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                        currentImageIndex === index
                          ? 'border-gray-800 shadow-md'
                          : 'border-transparent hover:border-gray-400'
                      } focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2`}
                    >
                      <Image
                        src={safeImageSrc(image.object_path)}
                        alt={`${productDetails.name} view ${index + 1}`}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                      {currentImageIndex === index && (
                        <div className="absolute inset-0 bg-gray-800/10 backdrop-blur-[1px] rounded-md" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              {/* Product Name and Price */}
              <div>
                <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight font-sans">{productDetails.name}</h1>
                <div className="text-4xl font-bold text-gray-800 font-sans">₹{finalPrice.toFixed(2)}</div>
              </div>

              {/* Variant Selectors */}
              <div className="space-y-6">
                {/* Size Selector */}
                {availableSizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size: string) => (
                        <Button
                          key={size}
                          variant={selectedVariant?.size === size ? "default" : "outline"}
                          onClick={() => handleSizeSelect(size)}
                          className={`min-w-[60px] ${
                            selectedVariant?.size === size
                              ? 'bg-gray-800 text-white hover:bg-gray-700'
                              : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          } transition-all duration-200`}
                          disabled={
                            !productDetails.variants.some(v => v.size === size && v.color === selectedVariant?.color) &&
                            !productDetails.variants.some(v => v.size === size)
                          }
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {availableColors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color: string) => (
                        <Button
                          key={color}
                          variant={selectedVariant?.color === color ? "default" : "outline"}
                          onClick={() => handleColorSelect(color)}
                          className={`min-w-[80px] ${
                            selectedVariant?.color === color
                              ? 'bg-gray-800 text-white hover:bg-gray-700'
                              : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          } transition-all duration-200`}
                          disabled={
                            !productDetails.variants.some(v => v.color === color && v.size === selectedVariant?.size) &&
                            !productDetails.variants.some(v => v.color === color)
                          }
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              {selectedVariant && (
                <Badge className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  selectedVariant.stock_quantity > 0
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                } font-sans`}>
                  {selectedVariant.stock_quantity > 0
                    ? `In Stock (${selectedVariant.stock_quantity} available)`
                    : 'Out of Stock'
                  }
                </Badge>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white text-gray-700 hover:text-gray-800 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-10 text-center text-lg font-semibold text-gray-800 font-sans">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={selectedVariant ? quantity >= selectedVariant.stock_quantity : true}
                    className="w-9 h-9 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || cartLoading}
                  className="flex-1 bg-gray-800 text-white hover:bg-gray-700 transition-colors py-3 text-base rounded-md font-semibold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || cartLoading}
                  className="flex-1 bg-sky-600 text-white hover:bg-sky-500 transition-colors py-3 text-base rounded-md font-semibold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 transition-colors shrink-0"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                  />
                </Button>
              </div>

              {/* Product Description */}
              {productDetails.description && (
                <Card className="bg-gray-50/50 border border-gray-200/50 rounded-lg">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 font-sans">Description</h3>
                    <p className="text-gray-700 leading-relaxed font-sans">{productDetails.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};