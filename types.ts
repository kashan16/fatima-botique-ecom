// User and Profile Types
export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

// Address Types
export type AddressType = 'shipping' | 'billing' | 'both';

export interface Address {
  id: string;
  user_id: string;
  address_type: AddressType;
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  address_type: AddressType;
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default?: boolean;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_category_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// Product Types
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
export type ImageViewType = 'front' | 'back' | 'model' | 'details' | 'other';

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: ProductSize;
  color: string;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  product : Product;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string;
  object_path: string;
  bucket_name: string;
  view_type: ImageViewType;
  visibility: 'public' | 'private';
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  uploaded_at: string;
}

// Extended Product with Related Data
export interface ProductWithDetails extends Product {
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductVariantWithImages extends ProductVariant {
  images: ProductImage[];
  final_price: number; // base_price + price_adjustment
  product : Product;
}

// Cart Types
export type CartItemType = 'cart' | 'save_for_later';

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  item_type: CartItemType;
  added_at: string;
  updated_at: string;
}

export interface CartItemWithDetails extends CartItem {
  product_variant: ProductVariantWithImages;
  product: Product;
  subtotal: number;
}

export interface CartSummary {
  items: CartItemWithDetails[];
  saved_items: CartItemWithDetails[];
  subtotal: number;
  total_items: number;
  cart_id : string;
}

// Wishlist Types
export interface Wishlist {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_variant_id: string;
  added_at: string;
  updated_at: string;
}

export interface WishlistItemWithDetails extends WishlistItem {
  product_variant: ProductVariantWithImages;
  product: Product;
}

// Order Types
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'cod_pending';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  shipping_address_id: string;
  billing_address_id: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  amount_paid: number;
  is_paid: boolean;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  transaction_id: string | null;
  payment_summary: Record<string, unknown>;
  payment_expires_at: string | null;
  payment_method: string | null;
  order_status: OrderStatus;
  notes: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  variant_sku: string;
  size: ProductSize;
  color: string;
  price_at_purchase: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

// Payment Types
export type PaymentMethodType = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod' | 'razorpay';

export type PaymentProviderStatus = 
  | 'pending' 
  | 'authorized' 
  | 'captured' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled';

export interface OrderPayment {
  id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  method: string;
  amount: number;
  currency: string;
  status: PaymentProviderStatus;
  attempt_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: PaymentMethodType;
  notes?: string;
  items?: CreateOrderItemInput[];
}

export interface CreateOrderItemInput {
  product_variant_id: string;
  product_name: string;
  variant_sku: string;
  size: ProductSize;
  color: string;
  price_at_purchase: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutSummary {
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items_count: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
}

// Filter and Sort Types
export interface ProductFilters {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  sizes?: ProductSize[];
  colors?: string[];
  is_active?: boolean;
  in_stock?: boolean;
}

export interface ProductSortOptions {
  sort_by: 'price' | 'name' | 'created_at' | 'popularity';
  order: 'asc' | 'desc';
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}

export type CartItemResponse = {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  item_type: CartItemType;
  added_at: string;
  updated_at: string;
  product_variant: {
    id: string;
    product_id: string;
    sku: string;
    size: string;
    color: string;
    price_adjustment: number;
    stock_quantity: number;
    low_stock_threshold: number;
    is_available: boolean;
    created_at: string;
    updated_at: string;
    product: {
      id: string;
      category_id: string;
      name: string;
      slug: string;
      description: string | null;
      base_price: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    images: ProductImage[];
  } | null;
};
// Add to Order Types section
export interface OrderSummary {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  item_count: number;
  thumbnail_url?: string;
}

// Add to API Response Types section
export interface ReturnItem {
  order_item_id: string;
  quantity: number;
}

// Update OrderFilters to include pagination
export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Extend OrderWithDetails to include status history
export interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  status_history?: OrderStatusHistoryItem[]; // Make optional since not all APIs return it
}