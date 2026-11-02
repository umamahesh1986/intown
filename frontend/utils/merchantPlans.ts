import AsyncStorage from '@react-native-async-storage/async-storage';

export type MerchantPlanId = 'START' | 'LAUNCH';

export interface MerchantPlanFeature {
  label: string;
  included: boolean;
}

export interface MerchantPlan {
  id: MerchantPlanId;
  name: string;
  basePrice: number;
  recommended?: boolean;
  tagline: string;
  features: MerchantPlanFeature[];
}

export const MERCHANT_GST_RATE = 0.18;

// Single source of truth for merchant packs (registration + Privilege page + My Account)
export const MERCHANT_PLANS: MerchantPlan[] = [
  {
    id: 'START',
    name: 'START',
    basePrice: 499,
    tagline: 'Get your shop on INtown',
    features: [
      { label: 'Lifetime INtown access', included: true },
      { label: 'Store profile', included: true },
      { label: 'Products / services', included: true },
      { label: 'Create offers', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Pick @ store', included: false },
      { label: 'Slot Booking', included: false },
      { label: 'Circle', included: false },
      { label: 'Featured visibility', included: false },
      { label: 'Promotional campaign', included: false },
      { label: 'Promotional creative', included: false },
      { label: 'Social Media promotion', included: false },
      { label: 'Campaign report', included: false },
    ],
  },
  {
    id: 'LAUNCH',
    name: 'LAUNCH',
    basePrice: 999,
    recommended: true,
    tagline: 'Everything to grow your business',
    features: [
      { label: 'Lifetime INtown access', included: true },
      { label: 'Store profile', included: true },
      { label: 'Products / services', included: true },
      { label: 'Create offers', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Pick @ store', included: true },
      { label: 'Slot Booking', included: true },
      { label: 'Circle', included: true },
      { label: 'Featured visibility', included: true },
      { label: 'Promotional campaign', included: true },
      { label: 'Promotional creative', included: true },
      { label: 'Social Media promotion', included: true },
      { label: 'Campaign report', included: true },
    ],
  },
];

export const getMerchantPlanById = (id?: string | null): MerchantPlan | null =>
  MERCHANT_PLANS.find((p) => p.id === (id || '').toUpperCase()) ?? null;

export const merchantPlanRank = (id?: MerchantPlanId | null) => (id === 'LAUNCH' ? 2 : id === 'START' ? 1 : 0);

// Price incl. 18% GST, rounded to paise
export const merchantPlanTotal = (plan: MerchantPlan) => Math.round(plan.basePrice * (1 + MERCHANT_GST_RATE) * 100) / 100;
export const merchantPlanGst = (plan: MerchantPlan) => Math.round(plan.basePrice * MERCHANT_GST_RATE * 100) / 100;

// The merchant API has no plan field yet, so the active pack is kept on-device
// (per merchant id, plus a generic key used before the id is known at registration).
const planKey = (merchantId?: string | number | null) =>
  merchantId != null && String(merchantId).trim() ? `merchant_plan_${String(merchantId).trim()}` : 'merchant_plan';

export const getMerchantPlan = async (merchantId?: string | number | null): Promise<MerchantPlanId | null> => {
  try {
    const specific = await AsyncStorage.getItem(planKey(merchantId));
    const generic = specific || (await AsyncStorage.getItem('merchant_plan'));
    const plan = getMerchantPlanById(generic);
    return plan ? plan.id : null;
  } catch {
    return null;
  }
};

export const setMerchantPlan = async (merchantId: string | number | null | undefined, planId: MerchantPlanId): Promise<void> => {
  const pairs: [string, string][] = [['merchant_plan', planId]];
  if (merchantId != null && String(merchantId).trim()) pairs.push([planKey(merchantId), planId]);
  await AsyncStorage.multiSet(pairs).catch(() => {});
};
