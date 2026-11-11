# INCoins referral program and unified wallet

Implemented against the supplied backend contract on 11 November 2026.

## User-facing changes

- Customer dashboard: updated the existing rewards section to a phone-based INCoins wallet, with balance, backend update timestamp, refresh/retry, history, referral rewards and the existing redemption entry point.
- Merchant dashboard: added the same wallet, referral number sharing and recent activity section.
- Dual dashboard: both tabs use the same Zustand wallet. Switching roles does not clear it. The merchant tab retains merchant redemption details.
- `/incoins-history`: shared history screen with the backend balance, signed amounts, transaction types, descriptions, dates, loading/empty/error states and retry. Preserves backend transaction order.
- Existing `/rewards` screen: uses the shared phone wallet and recognizes referral, joining and existing cashback activity; retains purchase history and WhatsApp redemption. Its established chronological activity sorting remains.
- Referral display: 300 INCoins for Customer Free Trial, 500 for Merchant START and 1,000 for Merchant LAUNCH, for each eligible party. Centralized as documented settings with an eligibility/configuration caveat. No invented configuration API or referral link.

## APIs and accounting

Uses the existing environment-aware `INPOINTS_API_BASE` for:

- `GET /IN/coins/phone/{authenticatedPhone}`
- `GET /IN/coins/phone/{authenticatedPhone}/history`
- Corresponding `/IN/points/phone/...` aliases only after HTTP 404/405. Authorization failures and server errors do not trigger alias retries.

Requests attach the authenticated bearer token. Indian country-code formatting is normalized to ten digits. A mismatched phone returned by the API is rejected. Requests time out after 20 seconds.

Only the balance endpoint supplies the wallet balance. The frontend never sums transactions into the wallet, calculates referral/cashback credits, or writes a balance. Customer and merchant IDs are not used for wallet identity. History's total is parsed for compatibility but does not override the balance endpoint.

Shared in-memory state deduplicates requests. Account/token/session changes clear private wallet data, and a generation guard rejects late responses from previous sessions. Role-only changes retain state. Successful registration invalidates and refreshes the wallet; dashboard focus, payment completion and merchant approval also request a refresh. An absent authenticated session makes no wallet request.

## Registration

- Customer registration now uses documented `POST /IN/customers/register`, preserving existing customer fields and adding a stable installation `deviceId`.
- Merchant registration now uses documented `POST /IN/merchants/register`, preserving existing merchant fields and adding `subscriptionPlan: START | LAUNCH` from the selected plan. The existing Razorpay payment and verification flow is unchanged.
- Both preserve optional ten-digit `referredBy`. Client validation checks format only; there is no referrer lookup or eligibility calculation.
- Both success popups append the backend `referralMessage`, including unregistered-referrer warnings, without changing successful registration into an error. No message is invented when absent.
- Both forms have a synchronous submission guard to prevent duplicate taps while a request is pending. Sensitive registration payload/response/error logging was removed from these integration paths.

## Files

Created:

- `frontend/utils/incoins.ts`
- `frontend/utils/referralRegistration.ts`
- `frontend/store/incoinsStore.ts`
- `frontend/components/incoins/INCoinsWalletCard.tsx`
- `frontend/components/incoins/ReferralRewardsCard.tsx`
- `frontend/components/incoins/INCoinsHistoryList.tsx`
- `frontend/components/incoins/walletStyles.ts`
- `frontend/app/incoins-history.tsx`
- `frontend/scripts/test-incoins-referrals.cjs`
- `frontend/scripts/test-incoins-ui.cjs`
- `INCOINS_IMPLEMENTATION.md`

Modified:

- `frontend/app/_layout.tsx`
- `frontend/app/member-dashboard.tsx`
- `frontend/app/merchant-dashboard.tsx`
- `frontend/app/dual-dashboard.tsx`
- `frontend/app/rewards.tsx`
- `frontend/app/register-member.tsx`
- `frontend/app/register-merchant.tsx`
- `frontend/components/PaymentModal.tsx`
- `frontend/components/MerchantPaymentApprovals.tsx`
- `frontend/utils/api.ts`

## Validation

Passed frontend tests (run from `frontend`):

```sh
node scripts/test-incoins-referrals.cjs
node scripts/test-incoins-ui.cjs
node scripts/test-customer-registration-routing.cjs
node scripts/test-merchant-registration-consent.cjs
node scripts/test-merchant-plan-api.cjs
node scripts/test-incoins-redemption.cjs
```

New tests use mocked backend responses. Coverage includes six referrer/registrant combinations, organic registration, invalid-referrer success messages, request fields and plan values, normalization, legacy aliases, authorization headers, balance/history separation, signed transactions, role switching, request deduplication, account switching, late responses, logout, retry, duplicate registration taps and wallet/referral UI actions. They do not prove actual backend crediting, payment settlement or server access control.

ESLint on changed TypeScript files reports zero errors; existing warnings remain. New wallet/service/component files have no lint warnings. Full TypeScript checking reports 17 errors in untouched files: `app/location.tsx`, `app/member-navigate.tsx`, `app/shop-details.tsx`, `components/MerchantPlanCard.tsx`, `firebase/firebaseConfig.ts`, `styles/EXAMPLE_USAGE.tsx` and `styles/globalStyles.ts`. No errors were reported in the implementation files.

## Android/iOS and live backend acceptance

Run on both Android and iOS against the development backend with test accounts:

1. Log in as a customer and then as a merchant. Confirm the wallet loads the authenticated phone, shows the server balance/timestamp, and Refresh and View History work.
2. Use Share Referral Number and confirm the native share sheet contains that account's registered phone and no fabricated link.
3. Test Customer and Merchant referrers, each referring a new Customer, START Merchant and LAUNCH Merchant. Complete normal registration/payment. Confirm the backend message is shown and both eligible phone wallets receive exactly the server-configured rewards, once only.
4. Register organically and with a valid-format unregistered referrer. Confirm registration succeeds, no referral reward appears, and the backend warning is shown for the unregistered number. Invalid formats must be rejected before submission.
5. Rapidly tap registration twice and confirm one submission. Verify existing uploads, business details, subscription payment, navigation and merchant plan behavior.
6. With a dual user, compare both tabs and history. The wallet balance must be identical, including referral and cashback activity. Merchant redemption must use merchant details.
7. Turn off networking, refresh, then restore networking and Retry. No fabricated zero balance should replace an unavailable balance.
8. Switch accounts and log out while a request is pending. No prior-account wallet data may reappear after the response arrives.
9. Complete purchases/approvals and return to the wallet; confirm refreshed backend values and that redemption does not deduct locally.

Live contracts still need deployment verification: the supplied plural registration routes differ from the previous singular routes; the phone wallet and legacy aliases must exist in the selected environment. No rewards-configuration endpoint was present in the inspected integration, so displayed rewards are explicitly documented settings. The backend must enforce token ownership of the phone path, referral eligibility, duplicate-reward prevention, and all actual credits/debits. No database migrations were changed.

## Wallet 404 investigation

Read-only checks on 11 November 2026 used a dummy phone, without any account token or real user data:

- Development `/v3/api-docs` declares the phone balance/history routes and their points aliases.
- Development `/IN/coins/phone/0000000000` and `/history` return HTTP 200; the points balance alias also returns 200.
- Production phone coins balance/history and the points balance alias return HTTP 404. The phone-wallet backend deployment is required there; the frontend must not fabricate a zero balance or switch environments to conceal this.
- The running localhost Metro bundle includes the current wallet service and API configuration changes.

`utils/apiBaseUrl.ts` now normalizes host-only and `/IN`-suffixed overrides to exactly one `/IN` for the main and wallet API bases. Missing routes produce an explicit server-unavailable message, and diagnostic logging includes only the API base, without the phone or token. Added regression checks for duplicate `/IN` and both aliases returning 404. The API/state and UI test scripts pass; lint has no errors.

## Merchant wallet design

The merchant dashboard and dual merchant tab now use `components/incoins/MerchantWalletSummary.tsx`: the supplied screenshot's dark gradient wallet card, inset balance panel, orange View & Manage Wallet action and separate cream referral/share strip. Customer cards and the shared history remain available.

`app/merchant-incoin-wallet.tsx` follows `C:/Users/india/Downloads/stitch_special_offer_section_redesign (10)/code.html` (the folder contains `code.html`, not the requested `design.html`). The new page has the orange wallet hero, metrics row, merchant tools, approval strip, numbered referral tiers, registered-phone sharing, live activity, legal links and four-tab navigation. It is registered in `_layout.tsx` and opens from the compact card.

Balances remain sourced from the shared wallet API. Monthly earned/debit metrics summarize supplied history, without affecting the authoritative balance. Approvals come from the existing pending-payments API; Review opens the working approval component. Redeem uses the existing merchant redemption flow. Sample balances, Gold membership, bank accounts, automatic payouts and fabricated referral codes are not asserted. Buy INCoins explains that purchases are not currently available rather than initiating an unsupported payment.

UI regression checks now cover compact merchant navigation/sharing and rendering the new page with the shared balance. Lint has no errors. Visual matching has not been verified in a browser or device screenshot.
