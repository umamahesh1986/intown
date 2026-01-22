# IntownLocal App - Complete Restructuring Plan

## Current Status
The app currently has a simplified flow. Based on your detailed specification, here's the complete restructuring plan.

## New App Structure

### 1. User Flow (Common Entry Point)
**Screens Needed:**
- ✅ Splash Screen
- ✅ Location Permission
- ✅ Login (Phone)
- ✅ OTP Verification
- 🔄 **User Dashboard** (NEEDS MAJOR UPDATE)

### 2. User Dashboard Components Required

#### A. Header
- Logo (left) + User Profile (right)

#### B. Search Section
- Large search box for categories
- Search results → List of shops with:
  - Shop image
  - Shop name
  - Rating
  - **View** button → Opens registration tabs
  - **Navigate** button

#### C. Registration Modal/Screen
When user clicks "View" on a shop:
- Show 2 tabs: **Member** | **Merchant**
- Each tab shows respective registration form

#### D. Popular Categories
Grid of 9 categories:
- Grocery, Salon, Fashion, Electronics, Restaurants, Medical, Stationery, Bakery, Home Services

#### E. Theme Section
"Present Local Retail Shops to Digital Presence"

#### F. Savings Calculator
Interactive calculator with:
- Estimated Monthly Spend input
- Estimated Monthly Savings
- Estimated Annual Savings

#### G. Membership Plans
Two plans displayed:
- **IT Max**: ₹999/Year
  - Button: "Purchase Now"
  - On click → Show Member Registration Form
  
- **IT Max Plus**: ₹1499/Year (Most Popular)
  - Button: "Purchase Now"
  - On click → Show Member Registration Form

#### H. Nearby Shops Section
Scrollable list with shop cards

#### I. Footer
Final statement about offerings

---

## 3. Member Registration Form

### Fields Required:
1. Contact Name * (validation: min 2 characters)
2. Select Customer Location * (Map picker - full screen)
3. Email * (email validation)
4. Phone Number * (10 digits)
5. Pincode * (6 digits)
6. Upload Multi Image (multi-image uploader)
7. Terms & Conditions checkbox
8. Policy text (show in readable format)
9. Cancel & Register buttons

### API Integration:
```javascript
POST http://intownlocal.us-east-1.elasticbeanstalk.com/it/customer/
Body: {
  contactName: string,
  location: { latitude: number, longitude: number },
  email: string,
  phone: string,
  pincode: string,
  images: string[], // base64 or URLs
  agreedToTerms: boolean
}
```

### After Registration:
- Set user type to "member"
- Redirect to Member Dashboard

---

## 4. Merchant Registration Form

### Fields Required:
1. Business Name *
2. Contact Name *
3. Business Category *
4. Description of Business *
5. Years into Business *
6. Branches of Business *
7. Email * (validation)
8. Phone Number * (10 digits)
9. Pincode * (6 digits)
10. Select Business Location * (Map picker)
11. Address
12. Introduced By
13. Upload Multi Image
14. Terms & Conditions (merchant-specific terms)
15. Cancel & Register buttons

### API Integration:
```javascript
POST http://intownlocal.us-east-1.elasticbeanstalk.com/it/merchant/
Body: {
  businessName: string,
  contactName: string,
  category: string,
  description: string,
  yearsInBusiness: number,
  branches: number,
  email: string,
  phone: string,
  pincode: string,
  location: { latitude: number, longitude: number },
  address: string,
  introducedBy: string,
  images: string[],
  agreedToTerms: boolean
}
```

### After Registration:
- Set user type to "merchant"
- Redirect to Merchant Dashboard

---

## 5. Member Dashboard

### Header:
- Logo (left)
- Profile with dropdown (right):
  - Account Details
  - Membership Plan
  - Logout
- Show "Member" badge

### Search Functionality:
- Search by category → API call to get nearby shops
- Results: List with shop cards
  - Shop name
  - Photo
  - **View** button → Shop Details Page
  - **Navigate** button → Navigate Page

### Shop Details Page:
- Shop image, name, rating
- **Navigate to shop** button (bottom)
- **Pay** button (bottom fixed position)

#### Payment Flow from Shop Details:
1. Click "Pay Now"
2. Show payment form:
   - Total Amount (user input)
   - Instant Savings (10%)
   - Total Payable Amount
   - "Pay Now" button
3. Click "Pay Now" → Show payment options overlay:
   - PhonePe
   - GooglePay
   - Paytm
   - Cash
4. Select option → Mock payment → Show success popup
5. Save payment details in membership page

### Navigate Page:
- Full screen map with route to shop
- **Pay** button at bottom
- Same payment flow as above

### Categories Section:
- Grid of categories
- Click category → Show category page
- Category page → List of items
- Select item → Full screen map with shops in that category
- Select shop → Navigate page with payment

### Other Sections:
- Theme section
- Savings calculator
- Nearby shops
- Footer

---

## 6. Merchant Dashboard

### Header:
- Logo (left)
- Profile with dropdown (right):
  - Account Details
  - Merchant
  - Logout
- Show "Merchant" badge

### Main Content:
- Full merchant shop details
- Shop images
- Shop name
- Rating
- **Payment List Section:**
  - Customer Amount
  - Discount Amount
  - Total Received Amount
  - "Payment Completed" button
  - On click → Save and show in list format

---

## Implementation Components Needed

### New Screens to Create:
1. `register-member.tsx` - Member registration form
2. `register-merchant.tsx` - Merchant registration form
3. `member-dashboard.tsx` - Member dashboard
4. `merchant-dashboard.tsx` - Merchant dashboard
5. `shop-details-member.tsx` - Shop details for members
6. `navigate.tsx` - Navigation with map and payment
7. `category-page.tsx` - Category item listing
8. `location-picker.tsx` - Full screen map for location selection

### New Components to Create:
1. `ImagePicker.tsx` - Multi-image uploader
2. `MapLocationPicker.tsx` - Map for selecting location
3. `PaymentModal.tsx` - Payment options overlay
4. `SavingsCalculator.tsx` - Interactive calculator
5. `ShopCard.tsx` - Reusable shop card component
6. `CategoryGrid.tsx` - Category grid component

### Updated Screens:
1. ✅ `dashboard.tsx` - Update to User Dashboard spec
2. `otp.tsx` - Ensure userType is set to "user" after verification

---

## Technical Requirements

### Packages Needed:
- ✅ `expo-image-picker` - For multi-image upload
- ✅ `react-native-maps` - For maps (already added but needs proper config)
- ✅ `expo-location` - For GPS
- ✅ `@react-native-async-storage/async-storage` - For persistence
- Consider: `react-native-image-crop-picker` for better image handling

### Configuration Updates:
1. `app.json` - Add image picker permissions
2. `app.json` - Configure maps properly (may need custom dev client)

### State Management Updates:
- ✅ Add `userType` to auth store
- Add member data store
- Add merchant data store
- Add payment history store

---

## API Integration Plan

### Mock APIs (Current):
- ✅ Send OTP
- ✅ Verify OTP
- ✅ Get Shops
- ✅ Get Categories
- ✅ Get Plans
- ✅ Process Payment

### External APIs (To Integrate):
- 🔄 Register Member: `http://intownlocal.us-east-1.elasticbeanstalk.com/it/customer/`
- 🔄 Register Merchant: `http://intownlocal.us-east-1.elasticbeanstalk.com/it/merchant/`

### Future APIs Needed:
- Get shops by location and category
- Get member payment history
- Get merchant payment list
- Update member/merchant details

---

## Step-by-Step Implementation Order

### Phase 1: Core Registration (Priority 1)
1. Update User Dashboard layout
2. Create Member Registration Form
3. Create Merchant Registration Form
4. Implement Map Location Picker
5. Implement Multi-Image Picker
6. Test registration flow

### Phase 2: Member Flow (Priority 2)
1. Create Member Dashboard
2. Implement shop search and listing
3. Create Shop Details page for members
4. Create Navigate page with map
5. Implement Payment Modal
6. Test complete member flow

### Phase 3: Merchant Flow (Priority 3)
1. Create Merchant Dashboard
2. Implement payment list display
3. Implement payment completion flow
4. Test merchant flow

### Phase 4: Additional Features (Priority 4)
1. Savings Calculator
2. Category pages
3. Polish UI/UX
4. Add validations
5. Error handling

---

## Current Files Status

### Completed:
- ✅ Splash, Location, Login, OTP screens
- ✅ Auth store with userType support
- ✅ API utilities with mock registration
- ✅ Basic dashboard structure

### Needs Update:
- 🔄 dashboard.tsx → User Dashboard
- 🔄 map.tsx → May need for Navigate page
- 🔄 shop-details.tsx → Reuse for Member
- 🔄 payment.tsx → Reuse for Payment Modal

### To Create:
- ❌ register-member.tsx
- ❌ register-merchant.tsx
- ❌ member-dashboard.tsx
- ❌ merchant-dashboard.tsx
- ❌ navigate.tsx
- ❌ location-picker.tsx
- ❌ Components (ImagePicker, MapPicker, PaymentModal, etc.)

---

## Estimated Development Time

- **Phase 1 (Registration)**: 8-10 hours
- **Phase 2 (Member Flow)**: 10-12 hours
- **Phase 3 (Merchant Flow)**: 6-8 hours
- **Phase 4 (Polish)**: 4-6 hours

**Total**: 28-36 hours of development

---

## Notes

1. **Map Integration**: react-native-maps needs custom dev client for Expo SDK 54. Consider using Expo's built-in map or web-based fallback.

2. **Image Upload**: Need to convert images to base64 or upload to cloud storage before sending to API.

3. **Payment Integration**: Currently mocked. Real integration needs:
   - PhonePe SDK
   - Google Pay integration
   - Paytm SDK
   - Or unified payment gateway

4. **Form Validations**: Use `react-hook-form` + `zod` for better form handling.

5. **Testing**: Each flow needs thorough testing before integration.

---

## Next Steps for Developer

1. Start with Phase 1 - Core Registration
2. Create registration forms first (most critical)
3. Implement map picker component
4. Test registration with mock APIs
5. Move to Member Dashboard once registration works
6. Then implement Merchant Dashboard
7. Polish and add remaining features

---

**This is a significant restructuring project. The current code provides a good foundation, but major work is needed to match your specification exactly.**
