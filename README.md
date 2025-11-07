```markdown
# Fatima Boutique (E-Com platform)

A modern, full-featured e-commerce application built with Next.js, featuring a complete shopping experience from product discovery to order management.

## Features

### Core Shopping Experience
- **Product Catalog** - Browse products with advanced filtering and search
- **Shopping Cart** - Full cart management with save for later functionality
- **Wishlist** - Save products for future purchases
- **User Authentication** - Secure authentication with Clerk
- **Responsive Design** - Optimized for all devices

### Order Management
- **Checkout Process** - Complete checkout with address management
- **Order History** - View and manage past orders
- **Order Tracking** - Track order status and delivery
- **Returns & Cancellations** - Process returns and cancellations

### Payments & Security
- **Multiple Payment Methods** - Razorpay integration and Cash on Delivery
- **Secure Authentication** - Clerk-based user management
- **Address Management** - Multiple shipping addresses with defaults

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Razorpay
- **UI Components**: ShadCN/UI, Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query)

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-directory>

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
```

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Razorpay Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

The application expects the following Supabase tables:

- `addresses` - User addresses
- `user_profile` - User profiles
- `products` - Product catalog
- `product_variants` - Product variations
- `product_images` - Product images
- `categories` - Product categories
- `cart` & `cart_items` - Shopping cart
- `wishlist` & `wishlist_items` - User wishlists
- `orders` & `order_items` - Order management
- `order_payments` - Payment records
- `order_status_history` - Order status tracking

## Available Hooks

### Authentication & User

#### `useAuth()`
Enhanced authentication hook with user profile synchronization.

```typescript
const { user, profile, isSignedIn, isLoaded, updateProfile } = useAuth();

// Update user profile
await updateProfile({ username: 'john_doe', phone_number: '+1234567890' });
```

#### `useProfile()`
Complete user profile management.

```typescript
const { profile, loading, updateProfile, refresh } = useProfile();

// Update profile
await updateProfile({ 
  username: 'new_username', 
  phone_number: '+1234567890' 
});
```

#### `useUserAssets()`
Initialize and manage user-specific assets (cart, wishlist).

```typescript
const { assets, cartId, wishlistId, initializeAssets } = useUserAssets();
```

### Products & Catalog

#### `useProduct()`
Comprehensive product management with variants and images.

```typescript
const { 
  products, 
  productDetails, 
  getProductBySlug, 
  searchProducts,
  getRelatedProducts 
} = useProduct();

// Get product by slug
const product = await getProductBySlug('product-slug');

// Search products
const results = await searchProducts('search query');
```

#### `useCategory()`
Category management with tree structure support.

```typescript
const { 
  categories, 
  getCategoryTree, 
  fetchCategoryBySlug 
} = useCategory();

// Get category tree
const categoryTree = await getCategoryTree();

// Get category by slug
const category = await fetchCategoryBySlug('electronics');
```

#### `useSearch()`
Advanced product search with filtering and pagination.

```typescript
const { data, isLoading } = useSearch('laptop', {
  categories: ['electronics'],
  minPrice: 500,
  maxPrice: 2000,
  inStockOnly: true
});
```

#### `useSearchSuggestions()`
Real-time search suggestions.

```typescript
const { data: suggestions } = useSearchSuggestions('lap');
```

### Cart & Wishlist

#### `useCart()`
Complete shopping cart functionality.

```typescript
const { 
  cartItems, 
  cartCount, 
  cartTotal, 
  addToCart, 
  updateQuantity,
  removeFromCart,
  moveToSaveForLater 
} = useCart();

// Add to cart
await addToCart('variant-id', 2);

// Update quantity
await updateQuantity('cart-item-id', 3);
```

#### `useSaveForLater()`
Manage saved for later items.

```typescript
const { 
  saveForLaterItems, 
  moveToCart, 
  removeFromSaveForLater 
} = useSaveForLater();
```

#### `useWishlist()`
Wishlist management.

```typescript
const { 
  wishlistItems, 
  addToWishlist, 
  removeFromWishlist,
  isInWishlist 
} = useWishlist();

// Check if product is in wishlist
const isWishlisted = isInWishlist('variant-id');
```

### Orders & Checkout

#### `useCheckout()`
Complete checkout process with validation.

```typescript
const { 
  processCheckout, 
  validateCheckoutData,
  calculateOrderTotals 
} = useCheckout();

// Process checkout
const result = await processCheckout({
  shipping_address_id: 'addr_123',
  billing_address_id: 'addr_123',
  payment_method: 'razorpay',
  notes: 'Leave at front door'
});
```

#### `useOrder()`
Order management with cancellation and returns.

```typescript
const { 
  orders, 
  createOrder, 
  cancelOrder, 
  returnOrder,
  trackOrder 
} = useOrder();

// Track order
const tracking = await trackOrder('order-id');
```

#### `useOrderHistory()`
Paginated order history with filtering.

```typescript
const { 
  orders, 
  loadMore, 
  hasMore, 
  setFilters 
} = useOrderHistory(10, { status: 'delivered' });

// Load more orders
await loadMore();
```

### Address Management

#### `useAddresses()`
Complete address CRUD operations.

```typescript
const { 
  addresses, 
  createAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress 
} = useAddresses();

// Create new address
await createAddress({
  full_name: 'John Doe',
  address_line1: '123 Main St',
  city: 'New York',
  state: 'NY',
  pincode: '10001',
  address_type: 'shipping',
  is_default: true
});

// Set default address
await setDefaultAddress('address-id');
```

### Payments

#### `usePayment()`
Razorpay payment integration with COD support.

```typescript
const { 
  initializeRazorpayPayment, 
  handleCODOrder,
  getPaymentDetails 
} = usePayment();

// Initialize Razorpay payment
await initializeRazorpayPayment('order-id', 2500, 'INR');

// Handle COD order
await handleCODOrder('order-id');
```

### Utilities

#### `useDebounce()`
Debounce values for search and filtering.

```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
```

## Available Components

### Page Components

#### `MainPage`
The application homepage featuring new arrivals and featured products.

**Features:**
- Hero section with call-to-action
- New arrivals product grid
- Responsive design with glass morphism effects

**Usage:**
```typescript
<MainPage />
```

#### `ProductCatalog`
Complete product browsing experience with filtering and sorting.

**Features:**
- Advanced filtering by category, price range
- Sort options (newest, price, name)
- Search functionality
- Responsive grid layout

**Usage:**
```typescript
<ProductCatalog />
```

#### `ProductsPage`
Individual product detail page with variant selection.

**Features:**
- Product image gallery with thumbnails
- Variant selection (size, color)
- Quantity controls
- Add to cart and buy now actions
- Wishlist functionality

**Usage:**
```typescript
<ProductsPage />
```

#### `CartsPage`
Shopping cart management page.

**Features:**
- Cart item listing with images
- Quantity adjustments
- Move to wishlist/save for later
- Order summary with tax calculations
- Free shipping threshold display

**Usage:**
```typescript
<CartsPage />
```

#### `CheckoutsPage`
Complete checkout process.

**Features:**
- Address selection and management
- Order summary
- Payment method selection (COD/Razorpay)
- Order notes
- Form validation

**Usage:**
```typescript
<CheckoutsPage />
```

#### `OrdersPage`
Order history and management.

**Features:**
- Paginated order history
- Order status tracking
- Cancellation and return functionality
- Order details view

**Usage:**
```typescript
<OrdersPage />
```

#### `ProfilesPage`
User profile and address management.

**Features:**
- Profile information editing
- Address CRUD operations
- Default address management
- Tab-based navigation

**Usage:**
```typescript
<ProfilesPage />
```

### Shared Components

#### `Navbar`
Main navigation with user menu and search.

**Features:**
- Responsive design with mobile menu
- User authentication state
- Shopping cart and wishlist links
- Search functionality

**Usage:**
```typescript
<Navbar />
```

#### `Footer`
Site footer with links and newsletter signup.

**Features:**
- Newsletter subscription
- Customer care links
- Contact information
- Company links

**Usage:**
```typescript
<Footer />
```

#### `AnimatedBackground`
Animated background with gradient orbs and particles.

**Features:**
- Smooth animations with Framer Motion
- Gradient background effects
- Floating particles
- Performance optimized

**Usage:**
```typescript
<AnimatedBackground />
```

#### `CategoryCard`
Category display card for browsing.

**Features:**
- Hover animations
- Responsive design
- Category navigation

**Usage:**
```typescript
<CategoryCard name="Electronics" slug="electronics" />
```

#### `ProductCard`
Product display card with actions.

**Features:**
- Product image display
- Quick add to cart
- Wishlist toggle
- Price display
- Hover effects

**Usage:**
```typescript
<ProductCard 
  product={product}
  onProductClick={handleClick}
  onAddToCart={handleAddToCart}
  onWishlistToggle={handleWishlist}
/>
```

#### `PageSection`
Reusable page section container.

**Features:**
- Consistent spacing
- Title and subtitle support
- Responsive design

**Usage:**
```typescript
<PageSection title="About Us" subtitle="Learn more about our company">
  <p>Content goes here...</p>
</PageSection>
```

## Component Architecture

### Props Interface

Most components follow a consistent props pattern:

```typescript
interface ComponentProps {
  // Required props
  data: DataType;
  
  // Optional props with defaults
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  
  // Event handlers
  onAction?: (data: ActionData) => void;
  
  // State props
  loading?: boolean;
  disabled?: boolean;
  
  // Style props
  className?: string;
}
```

### State Management

Components use a combination of:
- **Local State** - UI state (loading, form data)
- **Custom Hooks** - Business logic (cart, user, products)
- **URL State** - Filtering and routing

### Error Handling

Components implement comprehensive error handling:

```typescript
try {
  // Component logic
} catch (error) {
  console.error('Component error:', error);
  toast.error('Something went wrong');
}
```

## Styling & Theming

### Design System
- **Colors**: Gray scale with pink accents
- **Typography**: Inter font family
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle shadows for depth

### Glass Morphism Effect
Many components use glass morphism design:

```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

### Responsive Design
- **Mobile First**: Components designed for mobile first
- **Breakpoints**: Tailwind CSS breakpoints
- **Flexible Grids**: CSS Grid and Flexbox layouts

## Data Flow

### Component Hierarchy
```
App
├── Navbar
├── MainPage/ProductCatalog/ProductsPage/etc.
└── Footer
```

### State Propagation
- **User State**: Clerk authentication → Custom hooks → Components
- **Cart State**: useCart hook → Cart components
- **Product State**: useProduct hook → Product components

### Hook Data Flow
1. **Authentication** → User signs in via Clerk
2. **Profile Sync** → User profile created/updated in Supabase
3. **Asset Initialization** → Cart and wishlist initialized
4. **Data Fetching** → Hooks fetch user-specific data
5. **User Interactions** → Hooks update state and database
6. **UI Updates** → Components re-render with new data

## Hook Return Types

Each hook returns a consistent interface:

```typescript
interface HookReturn {
  // Data
  data: DataType[];
  
  // Loading states
  loading: boolean;
  isLoading: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  createItem: (payload) => Promise<void>;
  updateItem: (id, payload) => Promise<void>;
  deleteItem: (id) => Promise<void>;
  
  // Utilities
  refresh: () => Promise<void>;
}
```

## Usage Examples

### Product Listing with Search

```typescript
function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, loading } = useProduct();
  const { data: searchResults } = useSearch(searchTerm);

  const displayProducts = searchTerm ? searchResults?.products : products;

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      
      {displayProducts?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Shopping Cart Component

```typescript
function ShoppingCart() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();

  return (
    <div>
      {cartItems.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
          onRemove={() => removeFromCart(item.id)}
        />
      ))}
      <div>Total: ${cartTotal}</div>
    </div>
  );
}
```

### Checkout Flow

```typescript
function CheckoutFlow() {
  const { addresses, createAddress } = useAddresses();
  const { processCheckout } = useCheckout();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <AddressSection 
        addresses={addresses}
        onCreateAddress={createAddress}
      />
      <OrderSummary />
      <PaymentSection onCheckout={processCheckout} />
    </div>
  );
}
```

## Performance Optimizations

### Image Optimization
- Next.js Image component with lazy loading
- Optimized image sizes and formats
- Blur placeholders for better UX

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading for below-fold content

### State Optimization
- Memoized callbacks with useCallback
- Optimized re-renders with React.memo
- Efficient state updates

### Hook Optimizations
- **Debounced search** to reduce API calls
- **Memoized callbacks** to prevent unnecessary re-renders
- **Optimistic updates** for immediate UI feedback
- **Pagination support** for large datasets
- **Query caching** with React Query

## Security Features

### Authentication
- Clerk-based authentication
- Protected routes
- Session management

### Data Validation
- Form validation on client and server
- Input sanitization
- TypeScript type checking

### Payment Security
- Secure payment processing
- PCI compliance with Razorpay
- Secure API endpoints

### Hook Security
- **Row Level Security (RLS)** - All Supabase queries are user-scoped
- **Authentication Guards** - Hooks validate user authentication
- **Input Validation** - Comprehensive payload validation
- **Error Boundaries** - Graceful error handling

## Troubleshooting

### Common Issues

1. **Authentication Problems**
   - Check Clerk configuration
   - Verify environment variables
   - Clear browser storage

2. **Cart State Issues**
   - Check user authentication state
   - Verify Supabase connection
   - Clear local storage

3. **Payment Failures**
   - Verify Razorpay keys
   - Check network connectivity
   - Validate order amounts

4. **Database Errors**
   - Verify table structures match expectations
   - Check Supabase connection
   - Validate RLS policies

### Debug Mode

Enable debug logging in development:

```typescript
localStorage.setItem('debug', 'ecommerce:*');
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-component`
3. Commit your changes: `git commit -m 'Add new component'`
4. Push to the branch: `git push origin feature/new-component`
5. Submit a pull request

### Component Development Guidelines

1. **Follow the design system**
2. **Use TypeScript for type safety**
3. **Implement responsive design**
4. **Add proper error handling**
5. **Include loading states**
6. **Write comprehensive documentation**

### Hook Development Guidelines

1. **Follow consistent return type patterns**
2. **Implement comprehensive error handling**
3. **Include loading states**
4. **Optimize performance with memoization**
5. **Validate user authentication**
6. **Provide refresh capabilities**

## License

MIT License - see LICENSE file for details.

## Next Steps

The application provides a solid foundation for an e-commerce platform. Future enhancements could include:

- [ ] Advanced search with AI recommendations
- [ ] Multi-vendor support
- [ ] Inventory management
- [ ] Advanced analytics dashboard
- [ ] Mobile app with React Native
- [ ] Internationalization (i18n)
- [ ] Advanced payment methods
- [ ] Social media integration
- [ ] Customer reviews and ratings
- [ ] Abandoned cart recovery
- [ ] Advanced hook optimizations
- [ ] Real-time inventory updates
- [ ] Bulk operations for admin features
```