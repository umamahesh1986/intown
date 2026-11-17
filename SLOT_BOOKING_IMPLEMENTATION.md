# Slot booking integration

Implemented against the supplied slot_booking_frontend_integration_guide.md.

Customer entry: merchant details shows Book a Slot only when the merchant detail API returns isSlotBookingEnabled=true. The selection screen requests server-generated slots for today through today +7 inclusive (the guide also says seven dates, but the explicit API window includes eight). Unavailable slots are disabled. Restaurant requests support 1–20 people; other categories send 1. Booking history is available from the customer menu and dual dashboard. Pending requests can be cancelled; confirmed bookings use the inclusive 60-minute cutoff. Dates and slot times use Asia/Kolkata.

Merchant entry: Manage Slot Bookings on merchant and dual dashboards. Daily schedule includes pending counts, confirmed and past filters, date selection, accept/reject with optional reason, complete and no-show. Merchant identity is resolved from the signed-in phone, not a customer or route ID. Profile settings add isSlotBookingEnabled and slotCapacity to the existing merchant PATCH flow alongside business timings. The guide supplies no dedicated settings API.

The six documented /IN/slots endpoints are used with the existing environment-aware API base, bearer authentication, timeout and backend error handling. Server responses remain authoritative for status, expiry, capacity and credits. Lists refresh on focus, manually and every minute while focused. Submissions have synchronous duplicate-tap guards. Requests are not automatically retried after ambiguous network failures.

Design follows the app's orange accents, navy headings, muted slate copy, pale background and rounded white cards, with guide-specific status badge colors.

Read-only development checks on 16 November 2026: /v3/api-docs returned 200 but advertised no slots or slot-bookings paths. Both /IN/slots/available and /IN/slot-bookings/available returned 404 with dummy merchantId=0. No bookings or merchant settings were changed during verification. Deploy the backend feature before live acceptance testing. Settings persistence and authenticated booking/approval flows require live test accounts and backend deployment.

Validation: node scripts/test-slot-bookings.cjs verifies time boundaries, date rollover, disabled slot states, authentication, all six contracts and backend errors using mocks. Device visual verification and live booking lifecycle remain outstanding. Full TypeScript checking reports pre-existing unrelated project errors; no booking-file errors.


## Booking discovery and notifications

Restaurant/salon category lists now explain where to start. Merchant details display a booking-unavailable explanation when the server does not return isSlotBookingEnabled=true. The enablement gate remains required by the guide.

Successful booking requests notify the merchant through the existing push relay. Successful merchant decisions notify the customer; cancellation notifies the merchant. Notification payloads and the existing bell/push bridge now route to booking screens with the correct date and status filter. A global foreground poller checks customer status changes and merchant pending requests over all eight bookable dates every minute and on app resume, with persisted snapshots and notification deduplication. It does not run when the app is closed; closed-app delivery requires the deployed push relay, token registration, OS permissions and connectivity. Server-originated expiry notifications while the app is closed require backend support. No new messaging endpoint is invented.

node scripts/test-booking-notifications.cjs passes mocked checks for recipient identity, confirmation copy, rejection reason, booking-date routing and compatibility with order pushes. No live notifications were sent during verification. Two-device request/approval/push acceptance testing remains outstanding, alongside backend route deployment.

## Merchant booking history views

The merchant calendar now separates date scope (Today, This Week, This Month, All History, or a specific date) from booking status (All, Pending, Confirmed, Past). Weeks run Monday to Sunday and months follow the India calendar. Week/month views aggregate every daily endpoint with at most four concurrent requests, deduplicate records and sort newest first. A failed daily request fails the range instead of presenting partial results as complete.

Correction after live schema verification: GET /IN/slots/merchant/{merchantId} defaults to today when date is omitted. All History now targets the required separate /IN/slots/merchant/{merchantId}/history resource. The deployed schema currently has no such history resource; the remote booking backend must implement it. See MERCHANT_BOOKING_HISTORY_BACKEND.md for the complete endpoint, authorization, query and acceptance contract. Missing support displays a service-update error rather than presenting today as complete history.

Validation: test-merchant-booking-history.cjs covers calendar boundaries, leap years, range aggregation, concurrency, all-history request, errors and stale-request suppression. Merchant access and view regression tests pass.
