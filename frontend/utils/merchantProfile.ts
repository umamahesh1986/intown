type RecordData = Record<string, any>;

// Both search and detail endpoints may wrap their result in `data` or `merchant`.
export function merchantRecord(response: any): RecordData | null {
  let value = response;
  for (let depth = 0; depth < 4; depth++) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (value.merchant && typeof value.merchant === 'object') value = value.merchant;
    else if (value.data && typeof value.data === 'object') value = value.data;
    else break;
  }
  const id = value?.id ?? value?.merchantId;
  if (id == null || !String(id).trim() || ['null', 'undefined'].includes(String(id))) return null;
  return { ...value, id };
}

export async function loadMerchantProfile(
  phone: string,
  cachedMerchant: any,
  storedId: string | null,
  search: (phone: string) => Promise<any>,
  details: (id: string) => Promise<any>,
): Promise<RecordData> {
  // Resolve against the current API environment instead of trusting a stale ID
  // left by another login or an earlier environment.
  const lookup = phone ? await search(phone) : null;
  const identity = phone
    ? merchantRecord(lookup?.merchant ?? lookup?.data?.merchant)
    : merchantRecord(cachedMerchant);
  const id = identity?.id ?? (!phone ? storedId : null);
  if (id == null || !String(id).trim() || ['null', 'undefined'].includes(String(id))) {
    throw new Error('No merchant profile was found for this signed-in account.');
  }
  const record = merchantRecord(await details(String(id)));
  if (!record || String(record.id) !== String(id)) {
    throw new Error('The server returned an invalid merchant profile.');
  }
  const merged = { ...identity, ...record };
  const fields = ['contactName', 'businessCategory', 'description', 'openAt', 'offer', 's3ImageUrl', 'productNames'];
  if (!fields.some(field => Object.prototype.hasOwnProperty.call(merged, field))) {
    throw new Error('The server returned only a merchant identity, without profile details.');
  }
  return merged;
}
