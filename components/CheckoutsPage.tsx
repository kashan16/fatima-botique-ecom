/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAddresses } from '@/hooks/useAddresses';
import { useCart } from '@/hooks/useCart';
import { useOrder } from '@/hooks/useOrder';
import useProduct from '@/hooks/useProduct';
import { Address, CartItemWithDetails, CreateAddressInput, PaymentMethodType } from '@/types';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ShadCN components & icons
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export const CheckoutsPage: React.FC = () => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { cart, cartItems, cartTotal, loading: cartLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addresses, createAddress, loading: addressesLoading, refresh: refreshAddresses } = useAddresses();
  const { createOrder, loading: orderLoading, error: orderError } = useOrder();
  const { getImagesForProduct } = useProduct();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [productImages, setProductImages] = useState<{ [key: string]: any[] }>({});
  const [imagesLoading, setImagesLoading] = useState<Set<string>>(new Set());

  // Address form state
  const [addressForm, setAddressForm] = useState<CreateAddressInput>({
    address_type: 'shipping',
    full_name: user?.fullName || '',
    phone_number: user?.primaryPhoneNumber?.phoneNumber || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    is_default: false,
  });

  // Fetch images for products in cart
  const fetchProductImages = useCallback(async () => {
    if (!cartItems || cartItems.length === 0) return;

    const productIds = cartItems
      .map(item => item.product_variant?.product_id)
      .filter(Boolean) as string[];

    const uniqueProductIds = [...new Set(productIds)];
    
    for (const productId of uniqueProductIds) {
      if (imagesLoading.has(productId) || productImages[productId]) continue;

      setImagesLoading(prev => new Set(prev).add(productId));
      
      try {
        const images = await getImagesForProduct(productId);
        if (images) {
          setProductImages(prev => ({
            ...prev,
            [productId]: images
          }));
        }
      } catch (error) {
        console.error(`Failed to fetch images for product ${productId}:`, error);
      } finally {
        setImagesLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    }
  }, [cartItems, getImagesForProduct, imagesLoading, productImages]);

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      fetchProductImages();
    }
  }, [cartItems, fetchProductImages]);

  useEffect(() => {
    if (!isSignedIn) {
      toast.info("Please sign in to proceed to checkout.");
      router.push('/sign-in');
      return;
    }
  }, [isSignedIn, router]);

  // Select default address when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  useEffect(() => {
    if (user && !addressForm.full_name && !addressForm.phone_number) {
      setAddressForm(prev => ({ 
        ...prev, 
        full_name: user.fullName || '', 
        phone_number: user.primaryPhoneNumber?.phoneNumber || '' 
      }));
    }
  }, [user, addressForm.full_name, addressForm.phone_number]);

  // Show order errors
  useEffect(() => {
    if (orderError) {
      toast.error(orderError);
    }
  }, [orderError]);

  if (!isSignedIn) return null;

  if (cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Card className="p-8 text-center shadow-lg bg-white/80 backdrop-blur-sm rounded-lg border border-white/20">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-sans">Your Cart is Empty</h2>
          <p className="text-gray-700 mb-6">Looks like you haven&apos;t added anything to your cart yet.</p>
          <Button onClick={() => router.push('/')} className="bg-gray-800 text-white hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Shopping
          </Button>
        </Card>
      </div>
    );
  }

  const handleAddressSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsCreatingAddress(true);
      const newAddress = await createAddress(addressForm);
      setSelectedAddress(newAddress);
      setShowAddressForm(false);
      toast.success("New address added successfully!");
      // Reset form but keep user info
      setAddressForm({
        address_type: 'shipping',
        full_name: user?.fullName || '',
        phone_number: user?.primaryPhoneNumber?.phoneNumber || '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        is_default: false,
      });
      await refreshAddresses();
    } catch (err) {
      console.error('Failed to create address:', err);
      toast.error("Failed to add address.");
    } finally {
      setIsCreatingAddress(false);
    }
  };

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cartItems.find(item => item.id === cartItemId);
    if (item && item.product_variant?.stock_quantity && newQuantity > item.product_variant.stock_quantity) {
      toast.error('Cannot add more items than available in stock.');
      return;
    }
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await updateQuantity(cartItemId, newQuantity);
      toast.success('Item quantity updated!');
    } catch (error) {
      console.error('Failed to update error: ', error);
      toast.error('Failed to update quantity.');
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
      toast.info('Item removed');
    } catch (error) {
      console.error('Failed to remove item: ', error);
      toast.error('Failed to remove item.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const isCodAvailable = (() => {
    if (!selectedAddress) return false;
    const parts = [
      selectedAddress.city,
      selectedAddress.address_line1,
      selectedAddress.address_line2,
      selectedAddress.state,
      selectedAddress.landmark,
    ].filter(Boolean).join(' ').toLowerCase();
    return parts.includes('prayagraj') || parts.includes('allahabad');
  })();

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address.');
      return;
    }

    if (paymentMethod === 'cod' && !isCodAvailable) {
      toast.error('COD is not available for your location. Please select a different payment method.');
      return;
    }

    const orderData = {
      shipping_address_id: selectedAddress.id,
      billing_address_id: selectedAddress.id,
      payment_method: paymentMethod as 'cod' | 'razorpay',
      notes: orderNotes,
    };

    try {
      const order = await createOrder(orderData);
      if (order) {
        // Clear cart after successful order
        await clearCart();
        
        toast.success('Order placed successfully!');
        router.push(`/order-confirmation/${order.id}`);
      }
    } catch (err) {
      console.error('Order placement error:', err);
      // Error is already handled by the hook and shown via toast
    }
  };

  // Calculate amounts
  const subtotal = cartTotal;
  const shippingCost = subtotal > 500 ? 0 : 50;
  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + shippingCost + taxAmount;

  const cartItemsWithDetails = cartItems as CartItemWithDetails[];

  const OrderItem: React.FC<{ item: CartItemWithDetails }> = ({ item }) => {
    const productId = item.product_variant?.product_id;
    const images = productId ? productImages[productId] : [];
    const primaryImage = images?.find(img => img.is_primary) || images?.[0];
    
    const safeImageSrc = (path?: string | null) => {
      if (!path) return '/placeholder.png';
      const trimmed = path.trim();
      if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
      if (trimmed.startsWith('/')) return trimmed;
      return `/${trimmed.replace(/^\/+/, '')}`;
    };

    const imageSrc = safeImageSrc(primaryImage?.object_path);
    const isImageLoading = productId ? imagesLoading.has(productId) : false;
    
    const isUpdating = updatingItems.has(item.id);
    const basePrice = item.product_variant?.product?.base_price || 0;
    const priceAdjustment = item.product_variant?.price_adjustment || 0;
    const finalPrice = basePrice + priceAdjustment;

    return (
      <div className="flex gap-4 py-3 items-center">
        <div className="relative w-20 h-20 bg-gray-100/50 rounded-md overflow-hidden flex-shrink-0 border border-gray-200/50">
          {isImageLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : imageSrc && imageSrc !== '/placeholder.png' ? (
            <Image 
              src={imageSrc}
              alt={item.product_variant?.product?.name || 'Product image'} 
              fill 
              className="object-cover" 
              sizes="80px"
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
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-base font-sans line-clamp-1">
            {item.product_variant?.product?.name || 'Unknown Product'}
          </p>
          <p className="text-gray-700 text-sm">{item.product_variant?.size} | {item.product_variant?.color}</p>
          <p className="text-gray-700 text-sm">Qty: {item.quantity}</p>
        </div>
        <div className="grid items-center gap-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 font-sans text-base">
              ₹{(finalPrice * item.quantity).toFixed(2)}
            </p>
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
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleQuantityChange(item.id, item.quantity - 1)} 
              disabled={isUpdating || item.quantity <= 1}
              className="bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white"
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
              disabled={isUpdating}
              className="bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 relative">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Address Card */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg">
              <CardHeader className="border-b border-gray-200/50 p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900 font-sans">
                  <MapPin className="w-6 h-6 text-sky-600" /> Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.length === 0 && !showAddressForm && (
                      <p className="text-gray-700 text-center py-4">No addresses found. Please add a new one.</p>
                    )}
                    {addresses.map(a => (
                      <div 
                        key={a.id} 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedAddress?.id === a.id 
                            ? 'border-gray-900 bg-gray-50/80 backdrop-blur-sm shadow-sm' 
                            : 'border-gray-200/50 hover:border-gray-400 hover:bg-gray-50/50'
                        }`} 
                        onClick={() => { setSelectedAddress(a); setShowAddressForm(false); }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800 font-sans">{a.full_name}</p>
                              {a.is_default && (
                                <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm">{a.phone_number}</p>
                            <p className="text-gray-700 text-sm">
                              {a.address_line1}{a.address_line2 && `, ${a.address_line2}`}
                            </p>
                            <p className="text-gray-700 text-sm">{a.city}, {a.state} - {a.pincode}</p>
                            {a.landmark && <p className="text-gray-700 text-sm">Landmark: {a.landmark}</p>}
                          </div>
                          {selectedAddress?.id === a.id && <Check className="w-5 h-5 text-sky-600" />}
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => setShowAddressForm(prev => !prev)} 
                      variant="outline" 
                      className="w-full border-2 border-dashed border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50/50 transition-colors py-6 text-base"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showAddressForm ? 'Hide Form' : 'Add New Address'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {showAddressForm && (
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg">
                <CardHeader className="border-b border-gray-200/50 p-6">
                  <CardTitle className="text-xl font-semibold text-gray-900 font-sans">Add New Address</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddressSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="font-sans text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="full_name" 
                          required 
                          value={addressForm.full_name} 
                          onChange={(e) => setAddressForm({...addressForm, full_name: e.target.value})} 
                          className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone_number" className="font-sans text-gray-700">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="phone_number" 
                          type="tel" 
                          required 
                          value={addressForm.phone_number} 
                          onChange={(e) => setAddressForm({...addressForm, phone_number: e.target.value})} 
                          className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line1" className="font-sans text-gray-700">
                        Address Line 1 <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="address_line1" 
                        required 
                        value={addressForm.address_line1} 
                        onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})} 
                        className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2" className="font-sans text-gray-700">
                        Address Line 2 (Optional)
                      </Label>
                      <Input 
                        id="address_line2" 
                        value={addressForm.address_line2} 
                        onChange={(e) => setAddressForm({...addressForm, address_line2: e.target.value})} 
                        className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="font-sans text-gray-700">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="city" 
                          required 
                          value={addressForm.city} 
                          onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} 
                          className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="font-sans text-gray-700">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="state" 
                          required 
                          value={addressForm.state} 
                          onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} 
                          className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="font-sans text-gray-700">
                          Pincode <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="pincode" 
                          required 
                          value={addressForm.pincode} 
                          onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})} 
                          className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900" 
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="is_default" 
                        checked={addressForm.is_default} 
                        onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})} 
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                      />
                      <Label htmlFor="is_default" className="text-sm text-gray-700 font-sans">
                        Set as default address
                      </Label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="submit" 
                        className="bg-gray-900 text-white hover:bg-gray-700 transition-colors flex-1" 
                        disabled={isCreatingAddress}
                      >
                        {isCreatingAddress ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Address'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddressForm(false)} 
                        className="bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg">
              <CardHeader className="border-b border-gray-200/50 p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900 font-sans">
                  <CreditCard className="w-6 h-6 text-sky-600" /> Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(value: PaymentMethodType) => setPaymentMethod(value)}
                >
                  <div className="space-y-4">
                    <div className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'cod' 
                        ? 'border-gray-900 bg-gray-50/80 backdrop-blur-sm shadow-sm' 
                        : 'border-gray-200/50 hover:border-gray-400 hover:bg-gray-50/50'
                    } ${!isCodAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      <RadioGroupItem 
                        value="cod" 
                        id="cod" 
                        className="h-5 w-5 text-gray-900 focus:ring-gray-900" 
                        disabled={!isCodAvailable} 
                      />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 font-sans">Cash on Delivery</p>
                          <p className="text-sm text-gray-700">Pay when you receive your order</p>
                        </div>
                        <CreditCard className="w-6 h-6 text-gray-600" />
                      </Label>
                    </div>

                    {!isCodAvailable && (
                      <p className="text-sm text-red-600 mt-2">
                        COD is not available for your location. We currently deliver only to Prayagraj and Allahabad.
                      </p>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg">
              <CardHeader className="border-b border-gray-200/50 p-6">
                <CardTitle className="text-xl font-semibold text-gray-900 font-sans">
                  Order Notes (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea 
                  placeholder="Any special instructions..." 
                  value={orderNotes} 
                  onChange={(e) => setOrderNotes(e.target.value)} 
                  className="bg-white/50 backdrop-blur-sm border-gray-300 focus-visible:ring-gray-900 min-h-[120px] resize-y" 
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-lg sticky top-8">
              <CardHeader className="border-b border-gray-200/50 p-6">
                <CardTitle className="text-2xl font-semibold text-gray-900 font-sans">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {cartItemsWithDetails.map(item => (
                    <OrderItem key={item.id} item={item} />
                  ))}
                </div>
                <Separator className="my-6 bg-gray-200/50" />
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
                  onClick={handlePlaceOrder} 
                  disabled={!selectedAddress || orderLoading || (paymentMethod === 'cod' && !isCodAvailable)} 
                  className="w-full bg-gray-900 text-white hover:bg-gray-700 transition-colors py-4 text-lg font-semibold rounded-md flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing...
                    </>
                  ) : (
                    <>
                      Place Order <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <Link 
                  href="/cart" 
                  className="block w-full text-center bg-gray-100/80 backdrop-blur-sm hover:bg-gray-200/80 text-gray-800 py-3 px-6 rounded-md font-semibold font-sans mt-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 inline" /> Back to Cart
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};