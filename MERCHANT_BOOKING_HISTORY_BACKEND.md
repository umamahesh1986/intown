# Merchant booking history: required backend change

Verified against https://devapi.intownlocal.com/v3/api-docs on 2026-11-16:
`GET /IN/slots/merchant/{merchantId}` defaults to **today** when `date` is omitted.
The deployed schema exposes no full merchant booking history operation.
The remote booking backend source is not in this repository. `backend/server.py`
is a different FastAPI service without slot routes or booking persistence.

## Contract consumed by the updated frontend

`GET /IN/slots/merchant/{merchantId}/history`

Require the existing bearer authentication and verify that the principal owns
the merchant. Return 401 for unauthenticated callers and 403 for another merchant.

Return HTTP 200 with an array of the existing `SlotBookingResponseDto` records,
or the existing `data` envelope containing that array. Query every stored booking
belonging to this merchant, with no date, status, or retention-window filter.
Include pending, accepted, rejected, cancelled, completed, expired, and no-show
records, across older dates and future visits. Sort by booking date descending,
start time descending, then booking ID for stable ordering.

Return `[]` only for a merchant who has no bookings. Database errors must return
an error rather than an empty result. Do not silently truncate to a default page.
If pagination is needed, implement a corresponding paged frontend contract.
Keep the existing daily endpoint's default-to-today behavior unchanged.

Persistence operation, independent of the unavailable service's table names:

```text
select every booking where merchant_id = authenticated_merchant_id
order by booking_date descending, start_time descending, booking_id
```

## Acceptance checks

1. Seed records across multiple years, every booking status, and future dates.
   The history endpoint must return all of them for the owning merchant.
2. The daily endpoint still returns only today or its explicitly requested date.
3. Another merchant cannot read these records; unauthenticated requests fail.
4. An empty merchant returns an empty array; database failures return errors.

The frontend now targets this explicit history resource rather than calling the
daily endpoint without a date. Selecting All History resets search and status
filters. Missing backend support displays a service-update error instead of
presenting today's records as complete history. Regression tests cover the
endpoint and preservation of records across dates and statuses.

**This is a pending backend implementation contract, not a deployed endpoint.**
