/** Only display server-calculated rewards; reward rates can change. */
export function pickupRewardAmount(order: {
  pendingINcoins?: unknown;
  pointsEarned?: unknown;
  inCoins?: unknown;
  transaction?: { pointsEarned?: unknown } | null;
}): number | null {
  for (const value of [order.pendingINcoins, order.pointsEarned, order.inCoins, order.transaction?.pointsEarned]) {
    if (value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) continue;
    if (typeof value !== 'number' && typeof value !== 'string') continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount >= 0) return amount;
  }
  return null;
}

export function pickupRewardApprovalMessage(amount: number | null): string {
  return amount === null
    ? 'Your approval allows the customer to receive INcoins for their payment. The reward amount is not available yet.'
    : `The customer will receive ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} INcoins on your approval.`;
}
