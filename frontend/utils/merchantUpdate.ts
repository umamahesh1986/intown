/** Normalize GET-shaped merchant data before sending it to the PATCH endpoint. */
export function merchantUpdatePayload(input: Record<string, any>): Record<string, any> {
  const payload = { ...input };
  // Images are managed by the separate S3 upload endpoints, not merchant PATCH.
  delete payload.s3ImageUrl;
  delete payload.images;
  delete payload.profileImage;
  delete payload.profileImageUrl;

  const end = payload.specialOfferEndDate;
  if (end == null || end === '') {
    // The API ignores null; omitting it also prevents resending an invalid date.
    delete payload.specialOfferEndDate;
  } else {
    const date = new Date(end);
    if (Number.isNaN(date.getTime())) throw new Error('Choose a valid special-offer end date.');
    // The backend GET returns +00:00, but PATCH accepts the canonical UTC Z form.
    payload.specialOfferEndDate = date.toISOString();
  }
  return payload;
}
