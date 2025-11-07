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
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export const CartsPage = () => {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const {
    cart,
    cartItems,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    moveToSaveForLater,
    loading: cartLoading,
    error: cartError,
  } = useCart();

  const {
    addToWishlist,
    loading: wishlistLoading,
  } = useWishlist();

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
          <p className="text-gray-600 mb-6">Please sign in to view and manage your shopping cart.</p>
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
            className="mt-3 w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen py-12 relative">
        <div className="container mx-auto px-4">
          <Card className="p-8 text-center max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-red-200/50 shadow-sm rounded-lg">
            <h1 className="text-2xl font-bold text-red-800 mb-4 font-sans">Error Loading Cart</h1>
            <p className="text-gray-700 mb-6">{cartError}</p>
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

  if (!cart) {
    return (
      <div className="min-h-screen py-12 relative">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg">
            <ShoppingCart className="w-24 h-24 text-gray-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4 font-sans">Your Cart is Empty</h1>
            <p className="text-gray-700 mb-8 text-lg">Add some beautiful products to your cart to see them here.</p>
            <Link
              href="/"
              className="bg-gray-900 hover:bg-gray-700 text-white px-8 py-4 rounded-md font-semibold font-sans inline-flex items-center transition-colors text-base"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const item = cartItems.find(item => item.id === cartItemId);
    if (item && item.product_variant?.stock_quantity && newQuantity > item.product_variant.stock_quantity) {
      toast.error("Cannot add more items than available in stock.");
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await updateQuantity(cartItemId, newQuantity);
      toast.success("Cart quantity updated!");
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error("Failed to update quantity.");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await removeFromCart(cartItemId);
      toast.info("Item removed from cart.");
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error("Failed to remove item.");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  type CartItemType = typeof cartItems[number];

  const handleMoveToWishlist = async (item: CartItemType) => {
    setUpdatingItems(prev => new Set(prev).add(item.id));
    try {
      // First remove from cart
      await removeFromCart(item.id);
      // Then add to wishlist
      await addToWishlist(item.product_variant_id);
      toast.success("Item moved to wishlist!");
    } catch (error) {
      console.error('Failed to move to wishlist:', error);
      toast.error("Failed to move item to wishlist.");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleMoveToSaveForLater = async (cartItemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await moveToSaveForLater(cartItemId);
      toast.success("Item moved to save for later!");
    } catch (error) {
      console.error('Failed to move to save for later:', error);
      toast.error("Failed to move item to save for later.");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const CartItem = ({ item }: { item: CartItemType }) => {
    const productVariant = item.product_variant;
    const product = productVariant?.product;
    const primaryImage = productVariant?.product_images?.[0];
    
    const isUpdating = updatingItems.has(item.id);
    const isLowStock = !!productVariant && productVariant.stock_quantity > 0 && productVariant.stock_quantity < 10;
    const isOutOfStock = !!productVariant && productVariant.stock_quantity === 0;

    // Calculate final price
    const basePrice = product?.base_price || 0;
    const priceAdjustment = productVariant?.price_adjustment || 0;
    const finalPrice = basePrice + priceAdjustment;

    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm mb-4 transition-all duration-200 hover:shadow-md hover:bg-white/90">
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
              <p className="text-xl font-bold text-gray-900 font-sans">
                ₹{finalPrice.toFixed(2)}
              </p>

              {isOutOfStock ? (
                <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs mt-1 font-medium">
                  Out of Stock
                </Badge>
              ) : isLowStock && item.quantity < productVariant.stock_quantity ? (
                <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs mt-1 font-medium">
                  Only {productVariant?.stock_quantity} left!
                </Badge>
              ) : null}
            </div>

            {/* Quantity Controls & Item Total */}
            <div className="flex items-center gap-4 sm:ml-auto">
              {isOutOfStock ? (
                <div className="text-sm text-red-600 font-medium">Unavailable</div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={isUpdating || item.quantity <= 1}
                    className="h-8 w-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-gray-900 text-base font-sans">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={isUpdating || item.quantity >= (productVariant?.stock_quantity ?? 0)}
                    className="h-8 w-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Item Total */}
              <div className="text-right min-w-[70px]">
                <p className="font-bold text-gray-900 text-xl font-sans">
                  ₹{(finalPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex sm:flex-col gap-2 sm:gap-1 ml-auto sm:ml-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoveToWishlist(item)}
                disabled={isUpdating || isOutOfStock || wishlistLoading}
                className="h-9 w-9 text-gray-500 hover:text-red-500 hover:bg-gray-100/50 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoveToSaveForLater(item.id)}
                disabled={isUpdating}
                className="h-9 w-9 text-gray-500 hover:text-blue-500 hover:bg-gray-100/50 transition-colors"
                title="Save for later"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
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

  const subtotal = cartTotal;
  const shippingCost = subtotal > 500 ? 0 : 50;
  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + shippingCost + taxAmount;

  return (
    <div className="min-h-screen py-12 relative">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans mb-4 sm:mb-0">Shopping Cart</h1>
          <Badge className="bg-gray-100/80 backdrop-blur-sm text-gray-800 border border-gray-200/50 text-lg px-4 py-2 rounded-full font-semibold font-sans">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg sticky top-8">
              <CardHeader className="border-b border-gray-200/50 p-6">
                <CardTitle className="text-2xl font-semibold text-gray-900 font-sans">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700 text-base">
                    <span className="font-sans">Subtotal</span>
                    <span className="font-semibold font-sans">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-base">
                    <span className="font-sans">Shipping</span>
                    <span className="font-semibold font-sans">
                      {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-base">
                    <span className="font-sans">Tax (18%)</span>
                    <span className="font-semibold font-sans">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-3 bg-gray-200/50" />
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span className="font-sans">Total</span>
                    <span className="font-sans">₹{totalAmount.toFixed(2)}</span>
                  </div>

                  {subtotal < 500 && (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 w-full text-center py-2 text-sm font-semibold mt-4">
                      Add ₹{(500 - subtotal).toFixed(2)} more for FREE shipping!
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gray-900 text-white hover:bg-gray-700 transition-colors py-4 text-lg font-semibold rounded-md flex items-center justify-center"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Link
                  href="/"
                  className="block w-full text-center bg-gray-100/80 backdrop-blur-sm hover:bg-gray-200/80 text-gray-800 py-3 px-6 rounded-md font-semibold font-sans mt-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 inline" />
                  Continue Shopping
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};