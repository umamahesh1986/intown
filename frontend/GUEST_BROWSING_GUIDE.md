# Guest Browsing Implementation Guide

## Overview
App now supports guest browsing to comply with Apple App Store guideline 5.1.1(v).
- ✅ Users can browse shops and products WITHOUT login
- ✅ Login is only required for account-based features

## Changes Made

### 1. AuthStore (`store/authStore.ts`)
- Added `isGuest: boolean` flag
- Added `setGuest(isGuest: boolean)` method
- Updated `logout()` to reset `isGuest` flag

### 2. Splash Screen (`app/index.tsx`)
- Shows "Browse as Guest" or "Login / Sign Up" options
- Routes guests to `/member-shop-list` page
- Routes authenticated users to their respective dashboards

### 3. Login Required Modal (`components/LoginRequiredModal.tsx`)
- Modal component that prompts users to login
- Use this in any account-based feature

## Implementation Checklist

### Pages that should allow GUEST browsing:
- [ ] `/member-shop-list` - Shop listing with filters
- [ ] `/member-shop-details` - Shop details and products
- [ ] `/search` - Product/shop search
- [ ] `/map` - Map view of shops
- [ ] `/location-picker` - Location selection

### Pages that require LOGIN (show LoginRequiredModal):
- [ ] `/checkout` - Payment/checkout
- [ ] `/payment` - Payment methods
- [ ] `/member-card` - Digital card (member only)
- [ ] `/account` - Profile/account settings
- [ ] `/payment-history` - Payment history
- [ ] `/savings` - Savings dashboard (member only)
- [ ] `/plans` - Membership plans (purchase requires login)

## Implementation Steps

### For Browse-Allowed Pages:
```typescript
// Example: member-shop-list.tsx
import { useAuthStore } from '../store/authStore';

export default function MemberShopList() {
  const { isGuest } = useAuthStore();
  
  // Guest can view the page freely
  return (
    <View>
      {/* Shop list content */}
    </View>
  );
}
```

### For Login-Required Pages:
```typescript
// Example: checkout.tsx
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { useAuthStore } from '../store/authStore';

export default function CheckoutPage() {
  const { isAuthenticated, isGuest } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // If guest tries to checkout, show login modal
    if (isGuest || !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isGuest, isAuthenticated]);

  if (isGuest || !isAuthenticated) {
    return (
      <>
        <LoginRequiredModal
          isVisible={showLoginModal}
          onDismiss={() => setShowLoginModal(false)}
          message="You need to log in to proceed with checkout"
        />
      </>
    );
  }

  return (
    <View>
      {/* Checkout content */}
    </View>
  );
}
```

### For Feature Buttons (Add to Cart, Wishlist, etc.):
```typescript
// Example button handler
const handleAddToCart = () => {
  if (isGuest || !isAuthenticated) {
    setShowLoginModal(true);
    return;
  }
  
  // Proceed with adding to cart
  // ...
};

<Pressable onPress={handleAddToCart}>
  <Text>Add to Cart</Text>
</Pressable>
```

## Pages to Update

1. **checkout.tsx** - Require login before checkout
2. **payment.tsx** - Require login for payment methods
3. **member-card.tsx** - Show login modal for guests
4. **account.tsx** - Require login for account settings
5. **payment-history.tsx** - Require login
6. **savings.tsx** - Require login for member features
7. **plans.tsx** - Allow browse, require login to purchase
8. **member-shop-details.tsx** - Allow browse, require login for add to cart
9. **member-shop-list.tsx** - Allow guest browsing

## Testing Checklist

- [ ] Fresh app launch shows "Browse as Guest" option
- [ ] Guest can browse `/member-shop-list` without login
- [ ] Guest can view shop details
- [ ] Guest clicking "Add to Cart" shows login modal
- [ ] Guest clicking "Buy/Checkout" shows login modal
- [ ] Login redirects to appropriate dashboard
- [ ] Previously logged-in user auto-routes to dashboard

## Notes

- Guest session is NOT persisted across app restarts (by design)
- Guest users have `isGuest: true` and `isAuthenticated: false`
- Convert guest to authenticated user when they login
- All guest browsing data is temporary

