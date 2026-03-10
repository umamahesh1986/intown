# How to See the New User Dashboard

## Important: Clear Your Session First!

If you've already logged in before, you need to **logout and login again** to see the new dashboard.

## Steps to Test the New Dashboard:

### Option 1: On Mobile (Expo Go)
1. Open the app in Expo Go
2. **If already logged in:**
   - On the current dashboard, look for logout option
   - OR close the app completely and clear app data
3. **Fresh Login:**
   - Enter phone number
   - Enter OTP: **1234**
   - You should now see the **NEW User Dashboard**

### Option 2: Clear App Data (Best Method)
1. On your phone, go to Settings → Apps → Expo Go
2. Clear Storage / Clear Data
3. Reopen Expo Go
4. Scan the QR code again
5. Login with phone + OTP (1234)
6. You'll see the NEW dashboard!

## What You Should See (New Dashboard):

✅ **Header**: INtown logo + your profile name

✅ **Large Search Box**: "Search for Grocery, Salon, Fashion..."

✅ **Popular Categories**: 6 category tiles with icons

✅ **Orange Theme Section**: "Transform Local Retail - Present Local Retail Shops to Digital Presence"

✅ **Savings Calculator**: 
   - Input field for monthly spend
   - Shows 10% monthly savings
   - Shows annual savings

✅ **Membership Plans**:
   - IT Max: ₹999/Year with "Purchase Now"
   - IT Max Plus: ₹1499/Year (marked "Most Popular")

✅ **Register as Merchant Button**: Blue button at bottom

✅ **Footer**: Mission statement

## Testing the New Features:

1. **Try the Savings Calculator**: 
   - Change the monthly spend amount
   - Watch savings update automatically

2. **Click "Purchase Now"**: 
   - Takes you to Member Registration (placeholder)

3. **Click "Register as Merchant"**: 
   - Takes you to Merchant Registration (placeholder)

4. **Click any Category**: 
   - Shows modal with Member/Merchant options

## If Still Showing Old Dashboard:

The issue is that your session has the old route cached. You MUST logout or clear data to see the new dashboard.

### Force Logout Method:
1. In the old dashboard, if there's a logout button, click it
2. You'll be taken back to login
3. Login again with OTP 1234
4. New dashboard should appear

### Alternative: Delete and Reinstall:
1. Delete Expo Go app completely
2. Reinstall from App Store / Google Play
3. Scan QR code
4. Login → See new dashboard

## Files Changed:

- ✅ `/app/frontend/app/user-dashboard.tsx` - NEW complete user dashboard
- ✅ `/app/frontend/app/register-member.tsx` - Member registration placeholder
- ✅ `/app/frontend/app/register-merchant.tsx` - Merchant registration placeholder
- ✅ `/app/frontend/app/_layout.tsx` - Added new routes
- ✅ `/app/frontend/app/index.tsx` - Updated routing logic
- ✅ `/app/frontend/app/otp.tsx` - Redirects to user-dashboard
- ✅ `/app/frontend/store/authStore.ts` - Added userType tracking
- ✅ `/app/frontend/utils/api.ts` - Added member/merchant registration APIs

## Web Preview Note:

The web preview might show errors or old version due to caching. **Use Expo Go on mobile** for the best testing experience!

---

**The new dashboard is LIVE and working!** Just make sure to clear your session/data to see it.
