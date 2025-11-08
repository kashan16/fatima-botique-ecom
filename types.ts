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

export interface Address extends CreateAddressInput {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  updated_by?: string;
}

export interface CreateAddressInput {
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  address_type: AddressType;
  is_default: boolean;
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
  image_url?: string
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
  deleted_at: string | null;
  updated_by: string | null;
  version: number;
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

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  review_text: string | null;
  images: string[] | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// Extended Product with Related Data
export interface ProductWithDetails extends Product {
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductVariantWithImages extends ProductVariant {
  images: ProductImage[];
  final_price: number; // base_price + price_adjustment (computed)
  product: Product;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  discount_applied: number;
  used_at: string;
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
  cart_id: string;
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
  updated_by: string | null;
  version: number;
  ip_address: string | null;
  user_agent: string | null;
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

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

// Extended Order with Related Data
export interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  status_history?: OrderStatusHistoryItem[];
}

// Order Notification and Payment Types
export interface OrderNotification {
  id: string;
  order_id: string;
  notification_type: 
    | 'order_confirmation' 
    | 'payment_success' 
    | 'payment_failed' 
    | 'order_shipped' 
    | 'order_delivered' 
    | 'refund_processed';
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

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
  risk_score: number | null;
  fraud_status: 'clean' | 'suspicious' | 'blocked' | null;
}

export interface OrderRefund {
  id: string;
  order_payment_id: string;
  provider_refund_id: string | null;
  amount: number;
  currency: string;
  reason: string | null;
  status: 'pending' | 'processed' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentAttempt {
  id: string;
  order_id: string;
  payment_method: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  error_code: string | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  attempted_at: string;
}

// Saved Payment Methods
export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  provider: string;
  token: string;
  card_last4: string | null;
  card_brand: string | null;
  card_type: 'credit' | 'debit' | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Policy Backup (optional)
export interface PolicyBackup {
  backed_up_at: string;
  schemaname: string | null;
  tablename: string | null;
  policyname: string | null;
  permissive: string | null;
  roles: string | null;
  cmd: string | null;
  qual: string | null;
  with_check: string | null;
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
  page?: number;
  limit?: number;
}

// Detailed Cart Item Response (extended fields)
export interface CartItemResponse {
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
}

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

export interface ReturnItem {
  order_item_id: string;
  quantity: number;
}
// Add these to your existing types

// Checkout and Order Creation Types
export interface CheckoutSummary {
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items_count: number;
}

export interface CreateOrderInput {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: 'razorpay' | 'cod';
  notes?: string;
  coupon_code?: string;
}

export interface CheckoutData {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: 'razorpay' | 'cod';
  notes?: string;
  coupon_code?: string;
}

// Enhanced Order Types
export interface OrderWithRelations extends OrderWithDetails {
  order_payments?: OrderPayment[];
  order_refunds?: OrderRefund[];
  status_history: OrderStatusHistoryItem[];
  can_cancel: boolean;
  can_return: boolean;
  return_window_days: number;
}

// Cart and Checkout Response Types
export interface CartResponse {
  cart: Cart | null;
  cartItems: CartItemWithDetails[];
}

export interface CheckoutResponse {
  message: string;
  order: Order;
  requires_payment: boolean;
  payment_intent?: {
    razorpay_order_id?: string;
    client_secret?: string;
  };
}

// Payment Types
export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// API Response Types for Orders
export interface OrdersListResponse {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderDetailResponse {
  order: OrderWithRelations;
}

// Filter Types
export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Return Request Types
export interface ReturnRequest {
  order_id: string;
  items: Array<{
    order_item_id: string;
    quantity: number;
  }>;
  reason: string;
}

// Enhanced Product Filter Types
export interface ProductFilters {
  category_id?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  sizes?: ProductSize[];
  colors?: string[];
  is_active?: boolean;
  in_stock?: boolean;
  search_query?: string;
  sort_by?: 'price' | 'name' | 'created_at' | 'popularity';
  sort_order?: 'asc' | 'desc';
}

// User Assets Types
export interface UserAssets {
  cart_id: string;
  wishlist_id: string;
  user_id: string;
  timestamp: string;
}

// Address Validation Types
export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: {
    address_line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

// Inventory Management Types
export interface StockUpdate {
  variant_id: string;
  new_quantity: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'return';
  notes?: string;
}

export interface LowStockAlert {
  variant_id: string;
  product_name: string;
  current_stock: number;
  threshold: number;
  last_updated: string;
}