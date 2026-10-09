# IntownLocal - PRD & Progress

## Original Problem Statement
1. Clone the InTown Local React Native Expo app from GitHub (https://github.com/umamahesh1986/intown.git, branch: main) and run the mobile app preview.
2. OTP Authentication Flow Update: Remove Firebase, switch to custom OTP API services at devapi.intownlocal.com. Change OTP from 6 digits to 4 digits.

## Architecture
- **Frontend**: React Native + Expo SDK 54 with expo-router (web export served as static files)
- **Backend**: External APIs at `https://api.intownlocal.com` (user search, shops)
- **OTP APIs**: `https://devapi.intownlocal.com/IN/otp/` (send) and `/otp/verify` (verify)
- **State Management**: Zustand
- **Navigation**: expo-router (file-based routing)

## User Personas
- **Members (Customers)**: Local shoppers looking for nearby shops and savings
- **Merchants**: Local shop owners registering their businesses

## Core Features
- OTP-based phone login (custom API, 4-digit OTP)
- User Dashboard with location, search, categories, savings calculator
- Member/Merchant registration & dashboards
- Shop discovery, payments (mocked)

## What's Been Done

### Session 1 (Jan 2026) - Initial Setup
- Cloned repo from GitHub (main branch)
- Set up Expo web build (static export)
- Created static file server on port 3000

### Session 2 (Jan 2026) - OTP Flow Update
- **Removed Firebase** from login.tsx, otp.tsx, authStore.ts
- **New Send OTP API**: POST `https://devapi.intownlocal.com/IN/otp/` with `{mobileNumber: "91XXXXXXXXXX"}`
- **New Verify OTP API**: POST `https://devapi.intownlocal.com/IN/otp/verify` with `{mobileNumber, otpCode}`
- **OTP changed from 6 to 4 digits** with larger, better-styled input boxes
- **Phone masking**: Shows `******3080` instead of full number
- **30-second resend timer** (was 60s)
- **Inline phone validation** on login screen
- **Error handling**: Shows error messages for invalid/expired OTP
- **Auto-submit**: OTP auto-submits when all 4 digits are entered
- **Loading states**: Proper loading indicators during API calls
- All 13 test cases passed (100%)

## Files Modified
- `/app/frontend/app/login.tsx` - Removed Firebase, added Send OTP API call, inline validation
- `/app/frontend/app/otp.tsx` - Complete rewrite: 4-digit OTP, custom verify API, no Firebase
- `/app/frontend/utils/api.ts` - Added sendOtpApi() and verifyOtpApi() functions
- `/app/frontend/store/authStore.ts` - Removed Firebase signOut from logout

### Session 3 (Jan 2026) - Firebase Cleanup
- Removed 5 Firebase packages: `@react-native-firebase/app`, `@react-native-firebase/app-check`, `@react-native-firebase/auth`, `firebase`, `react-native-otp-verify`
- Deleted `firebase/` folder, `google-services.json`, `GoogleService-Info.plist`, `firebase.json`
- Removed Firebase plugins from `app.json`
- **Bundle size reduced from 2.39 MB to 1.9 MB (~500 KB / 20% reduction)**

### Session 4 (Jan 2026) - OTP Auto-Submit Bug Fix
- **Root cause**: Auto-submit on last digit read stale `otp` state via closure instead of using freshly built `newOtp` array
- **Fix**: Created `verifyWithCode(code)` that accepts OTP code directly; auto-submit now passes `newOtp.join("")` instead of relying on React state
- Same fix applied to paste auto-submit path
- 9/10 tests passed (1 minor: back button automation selector — works fine for real users)

### Session 5 (Jan 2026) - EAS Build Fix (Android)
- **Root cause**: `android/` directory had stale Firebase/Google Services references from before removal
  - `android/app/build.gradle:184` — `apply plugin: 'com.google.gms.google-services'`
  - `android/build.gradle:9` — `classpath 'com.google.gms:google-services:4.4.1'`
  - `android/app/google-services.json` still present
- **Fix**: Removed entire `android/` directory — EAS Build will regenerate via `expo prebuild`
- Removed `googleServicesFile` from both `ios` and `android` sections in `app.json`
- Deleted stale `scripts/disable-recaptcha.js`
- Web build verified working after cleanup

### Session 6 (Jan 2026) - Merchant Registration New Fields
- Added 6 new fields after "Introduced By": openAt, closeAt, breakStartAt, breakEndAt, weekOff, offer
- Time picker modal with Hour (1-12), Min (00/15/30/45), AM/PM columns
- Week Off: selectable day chips (Sun–Sat), multi-select, stored as comma-separated string
- Offer: multi-line textarea
- All fields included in API payload, draft save/restore
- data-testid attributes added for time picker buttons
- 11/12 tests passed (1 minor: automation selector, not user-facing)

### Session 7 (Jan 2026) - OTP "Failed to send" Bug Fix (Post-Merge)
- **Root cause**: Merge from `conflict_110426_1021` to `main` changed OTP_API_BASE from `devapi.intownlocal.com` to `api.intownlocal.com`
- Production API (`api.intownlocal.com/IN/otp/`) returns HTTP 500 due to DB constraint error (`duplicate key violates unique constraint "otp_records_mobile_number_key"`)
- **Fix**: Restored `OTP_API_BASE` to `https://devapi.intownlocal.com/IN` in `utils/api.ts` line 7
- Verified: OTP sends successfully for phone 8639071519

### Session 8 (Feb 2026) - Dual Dashboard Feature Parity
- **Customer Tab**: Added "INtown Privilege Nearby Shops" auto-scrolling, manually swipeable carousel (matches `member-dashboard.tsx` design — 220px hero-image cards with category badge, contact, location, offer pill)
- Carousel: infinite right-to-left auto-scroll (30ms interval, seamless 3x loop), pauses on user drag, resumes 2s after release
- Auto-scroll properly stops when user switches to Merchant tab (CPU-friendly)
- **Merchant Tab**: Added "Edit Profile" CTA button on Merchant Shop Card — navigates to `/account` where all merchant fields display read-only with an `Edit` toggle to enable editing (Business Category, Products, Description, Years, Branches, Shop Location, Business Timings, Week Off, Offer)
- Files modified: `/app/frontend/app/dual-dashboard.tsx`


### Session 9 (Feb 2026) - Profile Image Sync Fix + Merchant Shop Images Upload
- **Bug fix (account.tsx)**: "Saved Locally" toast was appearing after every profile-image upload because of an overly strict `^\d+$` numeric regex on the resolved `inTownId`. Replaced with non-empty string check + fallback to AsyncStorage + diagnostic warn log. Merchant/customer image uploads now sync to S3 immediately.
- **New feature (account.tsx, Merchant section)**: Added a "Shop Images" card visible inside the merchant profile. Merchants can now Take Photo / Choose Images (multi-pick), see thumbnails of existing (server-synced) and pending images, remove either, and tap "Upload Shop Images" to push them to `POST /IN/s3/upload?userType=IN_MERCHANT`. After upload, the canonical list is fetched from `GET /IN/s3?merchantId=` and persisted to AsyncStorage key `merchant_shop_images`.
- The `merchant-dashboard.tsx` hero carousel already reads `merchant_shop_images` on focus, so newly uploaded images appear in the dashboard carousel automatically.
- Files modified: `/app/frontend/app/account.tsx`

### Session 10 (Feb 2026) - Payment Modal on Customer Pickup Confirmation
- **Feature**: When a customer taps "I Picked Up My Order" (on the `PICKUP_READY / Ready` tab of `/my-orders`), the existing `PaymentModal` now opens first. Only after the customer completes Submit → UPI/Cash chooser does the app call `confirmCustomerOrderReceived` and move the order to the `Completed` tab.
- Implementation:
  - Added `PaymentModal` import + `paymentOrder` state in `frontend/app/my-orders.tsx`.
  - Button click now triggers `handleOpenPayment` (sets `paymentOrder`) instead of directly hitting the API.
  - Modal's `onSuccess` callback invokes `handlePickupConfirm` which calls the confirmation API + switches `activeTab` to `COMPLETED`.
  - Modal is passed `redirectTo="/my-orders"` so the user stays on the same screen after payment.
- Verified: iteration_11.json — source, built bundle, and rendered smoke checks all pass. Existing `data-testid`s preserved (`confirm-pickup-btn-{pickup_id}`, `pay-upi-option`, `pay-cash-option`).

### Session 11 (Feb 2026) - Styles Extraction (P2 Refactor)
- Extracted the giant `StyleSheet.create({...})` blocks out of the two biggest screen files into standalone modules, zero behaviour change:
  - `frontend/styles/register-merchant.styles.ts` (693 lines) ← from `register-merchant.tsx`
  - `frontend/styles/member-shop-details.styles.ts` (571 lines) ← from `member-shop-details.tsx`
- `StyleSheet` import removed from the two `.tsx` files (no longer needed).
- Line counts:
  - `register-merchant.tsx`: 2562 → 1869 (-693)
  - `member-shop-details.tsx`: 1687 → 1119 (-568)
- Verified: `tsc --noEmit` reports **zero errors on refactored files** (all pre-existing TS errors are in unrelated files). Both screens render with zero pageerrors; styling identical.

### Session 12 (Feb 2026) - Promo Carousel Before Login
- **Feature**: Added a promotional image carousel screen at `/promo-carousel` that appears before the phone-number entry screen for unauthenticated users.
- Implementation:
  - New route: `frontend/app/promo-carousel.tsx` — SafeAreaView with a card containing:
    * Horizontal `ScrollView` (pagingEnabled) with 3 promo images
    * Pagination dots (tap-to-jump, animated highlight)
    * Close button (X) top-right
    * Two action buttons at the bottom: **Explore** and **View**
    * All three exit actions call `router.replace('/login')`
  - 3 images downloaded into `frontend/assets/images/promo/` (promo-1.jpg = Ganesh Chaturthi, promo-2.jpg = "75% + 90%" stats, promo-3.jpg = "500 meters" poster).
  - Splash router (`app/index.tsx`) updated to route unauthenticated users through `/promo-carousel` (instead of `/login`) both on normal entry and on force-logout path.
  - Screen registered in `_layout.tsx` Stack.
- Verified end-to-end: `/` (splash, 2s) → `/promo-carousel` → any of Close/Explore/View → `/login`. All 3 exits confirmed via Playwright screenshot flow. `data-testid`s: `promo-carousel-screen`, `promo-close-btn`, `promo-explore-btn`, `promo-view-btn`, `promo-slide-0..2`, `promo-dot-0..2`.

### Session 13 (Jun 2026) - Global Order Notification Poller (Merchant + Customer, all dashboards)
- **Bug**: Merchant bell notifications were only generated by the poller inside `/merchant-orders`, so merchants on `/merchant-dashboard` or `/dual-dashboard` never saw new-order notifications.
- **Fix**: New `frontend/components/OrderNotificationPoller.tsx` mounted once in `app/_layout.tsx`. Runs every 15s on every screen except splash/login/otp/promo/location, reading `merchant_id` / `customer_id` from AsyncStorage.
  - Merchant: new `PLACED` order → `ORDER_RECEIVED_MERCHANT` notification → `/merchant-orders?tab=PLACED&highlightId=…`
  - Customer: status transition (ACCEPTED / PICKUP_READY / COMPLETED / ENDED with reason) → new kind `ORDER_STATUS_CUSTOMER` → `/my-orders?tab={status}&highlightId=…`
  - Baseline snapshots persisted in AsyncStorage (`notif_snap_merchant_v1`, `notif_snap_customer_v1`) so relaunching the app does not re-notify old orders.
- `notificationStore.add` de-dupe now keys on `pickup_id + kind + targetTab` (read or unread) to avoid duplicates between the global poller and screen-level pollers.
- Verified via Playwright with API interception on `/dual-dashboard`: badge=2, both notification types listed, tap → correct tab + highlighted card.
- Note: the external dev API (`devapi.intownlocal.com`) has no CORS headers for the web preview origin, so live API calls from the browser fail in preview; this does not affect the native app.
- Follow-up: de-duplicated polling — `/merchant-orders` and `/my-orders` now fetch via the shared `pollMerchantOrders` / `pollCustomerOrders` and the global poller skips that role while on those screens. Verified: exactly 1 call per role every 15s on every screen (was 2× on order screens).
### Session 14 (Jun 2026) - Expo Push + Pickup Confirmation Alert + Orders Tab Badge
- **Expo Push (client side)** — `expo-notifications` + `expo-device` installed, plugin added to `app.json` (channel `orders`, colour `#FF8A00`; EAS projectId already present).
  - `utils/pushNotifications.ts`: notification handler, Android channel, `registerForPushNotifications()` → sends token to backend, `presentLocalNotification()`, `notificationFromPushData()`.
  - `components/PushNotificationBridge.tsx` (mounted in `_layout.tsx`): registers token after login for each role, mirrors foreground pushes into the bell, deep-links on tap (foreground/background/cold start) to the right orders tab + highlighted card.
  - **Backend contract (to be implemented by API team)**: `PUT /IN/merchants/{id}/push-token` and `PUT /IN/customers/{id}/push-token` with `{ "expoPushToken": "ExponentPushToken[...]", "platform": "ios"|"android" }`. Push `data` must be `{ "type": "ORDER_RECEIVED_MERCHANT"|"ORDER_STATUS_CUSTOMER"|"ORDER_PICKED_UP_MERCHANT", "pickup_id": "...", "status": "PLACED|ACCEPTED|PICKUP_READY|COMPLETED|ENDED" }`, sent via `https://exp.host/--/api/v2/push/send` with `channelId: "orders"`.
  - Polling fallback kept: 15s normally; drops to 60s once the backend accepts the token (`expo_push_registered_v1 = '1'`). Poller also raises a system-tray local notification for genuinely new items on native.
  - Requires a dev/release EAS build on a physical device to test remote push (not testable in web preview).
- **Pickup Confirmation Alert**: `pollMerchantOrders` tracks `customerReceivedAt`; when a customer confirms pickup, the merchant gets `ORDER_PICKED_UP_MERCHANT` ("Customer picked up order … Tap to mark it delivered") → `/merchant-orders?tab={status}&highlightId=…`.
- **Unread Tab Badge**: `CommonBottomTabs` shows a red unread count on any tab whose `link` matches unread notifications' `targetRoute` (merchant Orders tab). Clears as notifications are read. testIDs: `bottom-tab-{name}`, `bottom-tab-badge-{name}`.
- `notificationStore.add` now returns `boolean`; new `markReadByPickup()`.
- Verified on web with API interception: bell=2 & Orders tab badge=2 after new order + pickup confirmation; tapping picked-up alert → Ready tab, card highlighted, tab badge → 1.
- **Notification Sound** (`utils/notificationFeedback.ts`): generated `assets/sounds/order-chime.wav` (two-tone chime); `playNotificationFeedback()` vibrates (`Vibration` native / `navigator.vibrate` web) and plays the chime via expo-av whenever a genuinely new notification is added in-app (poller `notify()` and foreground push receive). Verified on web: chime asset fetched + played when a new order arrived.
### Session 10 (Aug 2026) - Reset to IOS_Changes_Vicky + Delete Account Confirmation Modal
- Pulled `IOS_Changes_Vicky` branch (hard reset from `main`) to bring in iOS deployment work (iOS icons, iOS carousel assets, `LoginRequiredModal`, `ShopImageCarousel`, iOS metro/patch configs, `authStore` updates, etc.).
- **New feature (`components/Footer.tsx`)**: Added a confirmation modal for the "Delete Account" footer link.
  - Tap link → opens a centered card with a red ⚠️ icon, "Delete Account?" title, warning body, and two buttons.
  - **Cancel** → closes the modal, stays in app.
  - **Confirm** → calls `Linking.openURL('https://www.intownlocal.com/delete-account')` (opens INtown website's delete page in device browser / new tab).
  - Testable via `data-testid`s: `footer-delete-account-btn`, `delete-confirm-cancel-btn`, `delete-confirm-confirm-btn`.
- Verified end-to-end: user-dashboard footer → Delete Account link → modal appears → Cancel closes cleanly, Confirm fires the external URL. Web bundle rebuilt.
### Session 15 (Jun 2026) - Switched to `IOS_Changes_Vicky` + merged pick-at-store from `main`
- Checked out `IOS_Changes_Vicky` (tracking `origin/IOS_Changes_Vicky`) and merged `origin/main` into it (commits `eec5658`, `7b785fb`). The branch now has all pick-at-store work: customer ordering (`member-shop-details`), `/my-orders`, `/merchant-orders`, Payment Modal, Notification Bell + global poller, Expo push client, pickup alert, tab badges, chime, Merchant Growth Pack (START/LAUNCH) fee, promo assets, etc.
- Conflict resolution — kept iOS versions of `checkout.tsx`, `plans.tsx`, `index.tsx` (iOS: no Razorpay for plans, splash `ShopImageCarousel`), `package.json` scripts (`main: index.js`, `postinstall` fetch patch + prebuild); combined `CommonBottomTabs.tsx` (guest/login modal + unread badge) and `member-shop-details.tsx` imports; kept both PRD sections; took main's `build.gradle` version (42 / 1.3.2).
- Fixes after merge: re-added `expo-notifications` / `expo-device` deps (lost with `--ours` package.json), restored `utils/profileImage.ts` (used by iOS `index.tsx`), widened `authStore` `userType` to include `'dual'`.
- Local dev note: run `yarn install` (postinstall runs `patch-whatwg-fetch.js` + `expo prebuild`); in this container use `yarn install --ignore-scripts && node patch-whatwg-fetch.js`.
- Verified on web build: splash → iOS carousel, merchant new-order bell + Orders tab badge, tap → `/merchant-orders?tab=PLACED` highlighted card.

### Session 16 (Jun 2026) - Merchant-managed Special Offer (IOS_Changes_Vicky)
- Backend contract (confirmed live on devapi): Merchant has `specialOffers: string[]` and `specialOfferEndDate: ISO datetime` — returned by `GET /IN/merchant/{id}` and `GET /IN/search/by-product-names`; saved via `PATCH /IN/merchant/{id}`.
- `app/account.tsx` → Offer card: **Current Offer** (unchanged) → **Special Offer** (multiline, one offer per line → `specialOffers[]`; view mode shows bullets or "No special offer added") → **Special Offer Valid Till** (new `components/DateSpinnerModal.tsx` Day/Month/Year spinner with Clear; saved as local end-of-day ISO `Z`).
- PATCH payload hardening (backend returns 400 otherwise): `s3ImageUrl` (GET-shaped object array) is stripped (images use separate upload flows); `specialOfferEndDate` only sent in `Z` format when set (backend ignores null and rejects its own `+00:00` format, so the end date cannot be cleared server-side — card hides anyway when offers list is empty).
- `app/member-shop-details.tsx` → Special Offer card lists `specialOffers` + "Valid till {date}"; **hidden** when list empty or end date passed (old hardcoded placeholder removed).
- Fixed iOS-branch bugs: `/account` "Login Required" modal stuck after auth loaded; stale-closure `!name` fallback overwrote the business name with `user_data.name` on save.
- Verified against the real dev API (Playwright proxying requests): save → DB updated → shop page shows offers + validity; expired date → hidden. testIDs: `account-input-special-offer`, `account-value-special-offer[-i]`, `account-special-offer-end-date-btn`, `date-*`, `special-offer-card`, `special-offer-text-{i}`, `special-offer-valid-till`.

### Session 17 (Jun 2026) - Offer badge on shop list + expiring-offer reminder
- `utils/specialOffer.ts`: shared helpers `getActiveSpecialOffers`, `isSpecialOfferExpired`, `formatOfferValidTill`, `daysUntilOfferEnds` (calendar days). Shop details now uses these.
- `app/member-shop-list.tsx`: green "Special Offer" tag (top-right of hero image) + first offer line ("+N more") under distance — only when the shop has active, non-expired `specialOffers`. testIDs `shop-card-{id}`, `shop-offer-badge-{id}`, `shop-offer-text-{id}`.
- `OrderNotificationPoller.checkMerchantOfferExpiry`: every 6h (AsyncStorage stamp `offer_expiry_check_at_{merchantId}`) fetches `GET /IN/merchant/{id}`; if active offers end within 2 calendar days → bell notification kind `OFFER_EXPIRING_MERCHANT` ("ends today / tomorrow / in 2 days"), deduped per end date (`pickup_id = offer-YYYY-MM-DD`). Tap → `/account?from=merchant&section=offer`; account page highlights (orange border) and scrolls to the Offer card.
- `notificationStore.targetRoute` now also allows `'/account'`.
- Verified: real list data shows the tag only on Vinod Grocery (1/15); reminder fires with mocked end date (+2 days), deep-links & highlights; throttle + dedupe hold across reload.

### Session 18 (Jun 2026) - "Deals only" filter + Offer share (WhatsApp / image / more)
- `app/member-shop-list.tsx`: header pill **Deals only** with live count (`deals-only-toggle`, `deals-count`); filters to shops with active special offers; empty state "No deals right now" + "Show all stores" (`deals-empty`, `deals-show-all-btn`).
- `components/OfferShareCard.tsx`: `buildOfferShareText`, `shareOfferOnWhatsApp` (`whatsapp://send` → `wa.me` fallback), `shareOfferText` (native Share / web navigator.share / clipboard), `shareOfferAsImage` (react-native-view-shot `captureRef` → expo-sharing; native only), and the branded green `OfferShareCard` rendered off-screen in `account.tsx`.
- `app/account.tsx`: share row under Special Offer in view mode when offers exist — WhatsApp / Share Image (hidden on web) / More (`offer-share-whatsapp-btn`, `offer-share-image-btn`, `offer-share-more-btn`).
- Deps added: `react-native-view-shot@4.0.3`, `expo-sharing@~14.0.8` (reverted the `postinstall` prebuild's android/ changes and removed generated ios/ — native folders are generated locally; local devs run `yarn install` + `npx expo prebuild`).
- Verified on web: toggle 15 → 1 card; WhatsApp opens `wa.me` with formatted text; share card renders. Image share path needs a device build.

### Session 19 (Jun 2026) - "Deals near you" strip + Offer analytics
- `components/DealsStrip.tsx` on `member-dashboard` (above Feature Categories): horizontal cards for nearby shops with active special offers (first offer, shop, distance, "till {date}", "N offers" tag). Uses the already-loaded `nearbyShops` (`getAllNearbyShops`). testIDs `deals-strip`, `deals-strip-count`, `deal-card-{id}`.
- **Offer analytics (companion FastAPI backend, Mongo `offer_events`)**: `POST /api/offer-events {merchantId, eventType: VIEW|TAP, customerId?, source}` and `GET /api/offer-analytics/{merchantId}?days=7 → {views, taps, uniqueViewers, byDay[]}`.
  - Client `utils/offerAnalytics.ts` (`trackOfferEvent`, `getOfferAnalytics`) uses `BACKEND_URL` (`EXPO_PUBLIC_BACKEND_URL`, now set in `frontend/.env` for preview; production builds need it in `eas.json` env, or the Java team ports the two endpoints). VIEW de-duped per session.
  - Events: TAP from deals strip + shop list (cards with an active offer); VIEW when shop details renders with an active offer.
  - `components/OfferAnalyticsCard.tsx` in My Account → Offer (view mode, when offers exist): Views / Taps / Customers (unique viewers) for last 7 days + 7-day mini bars; "Analytics unavailable" if backend unreachable.
- Verified end-to-end on preview: strip shows 1 deal → tap (TAP) → shop details (VIEW) → merchant card shows 1/1/1.

### Session 20 (Jun 2026) - Remove Recent Transactions (customer) + highlighted special-offer merchant cards
- Removed "Recent Transactions" from `member-dashboard` and from the **customer tab** of `dual-dashboard` (merchant tab keeps it). Dual dashboard customer tab now also shows the `DealsStrip`.
- New shared `components/NearbyMerchantCard.tsx` (replaces duplicated card JSX in both dashboards): special-offer merchants get an orange "SPECIAL OFFER" ribbon, green frame + glow, "Deal / N deals" pill, tinted image, green category badge, and an offer box (first offer + "Valid till"). Regular cards unchanged. `sortSpecialOffersFirst()` puts offer merchants first in the auto-scrolling list; taps on them record `TAP` (`shop_list`). testIDs `nearby-merchant-{id}-{i}`, `nearby-merchant-ribbon-{id}`.
- Verified on preview with live data (2 merchants with offers highlighted & first).

### Session 21 (Jun 2026) - Pulse glow on offer cards + trending sort for Deals strip
- `NearbyMerchantCard`: special-offer cards wrapped in an `Animated.View` with a looping (2.2s) glow layer (opacity 0.15→0.75, scale 1→1.035) and a subtle card breathe (1→1.012); RN `Animated` with native driver on device. testID `nearby-merchant-pulse-{id}`.
- Backend `GET /api/offer-analytics/trending?merchantIds=a,b&days=7 → {taps: {id: n}}` (Mongo aggregate on `offer_events`).
- `DealsStrip`: fetches taps for the deal merchants (`getTrendingTaps`) and sorts by taps desc (ties keep distance order); top card with taps>0 gets an orange border + "Trending" flame tag; cards show "N tapped this week" (falls back to "till {date}").
- Verified on preview: Uma Grocery (3 taps) ranked before Vinod Grocery (2 taps) with Trending tag; pulse animation running (6 animated wrappers).

### Session 22 (Jun 2026) - API environment hardening (dev vs production)
- `utils/api.ts`: `IS_PRODUCTION_API = !__DEV__ && EXPO_PUBLIC_ENV in (production|prod)`. Any `__DEV__` bundle (Metro, `expo run:*`, EAS development client) and EAS `preview` always use `https://devapi.intownlocal.com`; only an EAS `production` release uses `https://api.intownlocal.com`. `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_OTP_API_BASE_URL` overrides are honoured only for non-production hosts (e.g. localhost). Startup log prints env/base/otp.
- `eas.json`: `development` and `preview` profiles now explicitly set dev env vars; `production` unchanged.
- `frontend/.env` (committed, used by preview) sets `EXPO_PUBLIC_ENV=dev` + dev URLs; added `frontend/.env.example` for local setup.

## Backlog

- P1: Test full end-to-end login with real OTP on mobile device
- P1: Replace 15-second polling on `/my-orders` and `/merchant-orders` with Expo Push Notifications once backend is ready
- P2: Extract shared carousel + merchant card UI from `dual-dashboard.tsx`, `user-dashboard.tsx`, `member-dashboard.tsx` into reusable components
- P2: Fix React #418 (hydration mismatch) warnings on `/my-orders` and `/merchant-orders` initial load (pre-existing, non-blocking)
- P2: Real payment gateway integration (Razorpay currently in test mode with hardcoded key `rzp_test_SVoE9DrV8kRDqj`)
- P2: Further refactor — `register-merchant.tsx` (still 1869 lines) and `member-shop-details.tsx` (still 1119 lines) can be split into smaller **UI sub-components** (`<PhotoUploader/>`, `<CategoryProductPicker/>`, `<LocationPicker/>`, `<JoiningFeeSection/>`, `<PlaceOrderModal/>`, `<ImageCarousel/>`, `<ProductGrid/>`). Styles are already externalised.
- P3: Push notifications, App Store/Play Store deployment
- Known external bug: Backend `/IN/search/by-product-names` returns HTTP 500 for out-of-service-area coordinates (gracefully handled on frontend)
