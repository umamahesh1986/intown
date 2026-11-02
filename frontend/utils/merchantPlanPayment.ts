import { Platform } from 'react-native';
import { INTOWN_API_BASE } from './api';
import { loadRazorpayWebScript, openRazorpayWeb } from './razorpayWeb';
import { MerchantPlan, merchantPlanTotal } from './merchantPlans';

const RAZORPAY_KEY_ID = 'rzp_live_RrNfvARmKIkZ7C';

export interface MerchantPlanPaymentInput {
  plan: MerchantPlan;
  mobileNumber: string;
  contactName?: string;
  email?: string;
  merchantId?: string | number | null;
  description?: string;
  noteType?: string;
}

export interface MerchantPlanPaymentResult {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amountPaise: number;
}

export const isPaymentCancelled = (err: any) =>
  err?.code === 'PAYMENT_CANCELLED' || String(err?.description || '').toLowerCase().includes('cancel');

// create-order → Razorpay Checkout → verify. Throws on failure/cancel.
export const payForMerchantPlan = async (input: MerchantPlanPaymentInput): Promise<MerchantPlanPaymentResult> => {
  const { plan, mobileNumber, contactName, email, merchantId } = input;
  const description = input.description || `INtown Merchant ${plan.name} Pack`;
  const totalRupees = merchantPlanTotal(plan);

  const createOrderRes = await fetch(`${INTOWN_API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      mobileNumber,
      amount: totalRupees,
      description,
      notes: {
        type: input.noteType || 'MERCHANT_PLAN',
        plan: plan.id,
        phoneNumber: String(mobileNumber),
        merchantId: merchantId != null ? String(merchantId) : '',
        contactName: String(contactName || ''),
      },
    }),
  });
  if (!createOrderRes.ok) {
    const errData = await createOrderRes.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `Order creation failed (${createOrderRes.status})`);
  }
  const orderData = await createOrderRes.json();
  const amountPaise = Math.round(Number(orderData.amount ?? totalRupees) * 100);

  const razorpayOptions: any = {
    description,
    image: 'https://intown-prod.s3.ap-south-1.amazonaws.com/logo/intown-logo.png',
    currency: orderData.currency || 'INR',
    key: orderData.keyId || RAZORPAY_KEY_ID,
    amount: String(amountPaise),
    name: 'INtown',
    order_id: orderData.razorpayOrderId,
    prefill: { contact: mobileNumber, name: contactName || '', email: email || '' },
    theme: { color: '#FF8A00' },
  };

  let paymentResponse: any;
  if (Platform.OS === 'web') {
    const ok = await loadRazorpayWebScript();
    if (!ok) throw new Error('Unable to load Razorpay. Please check your internet connection.');
    paymentResponse = await openRazorpayWeb(razorpayOptions);
  } else {
    let RazorpayCheckout: any;
    try {
      RazorpayCheckout = require('react-native-razorpay').default;
    } catch {
      throw new Error('Payment module not available. Please update the app.');
    }
    paymentResponse = await RazorpayCheckout.open(razorpayOptions);
  }

  const verifyRes = await fetch(`${INTOWN_API_BASE}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpaySignature: paymentResponse.razorpay_signature,
      amount: amountPaise,
      mobileNumber,
    }),
  });
  const verifyData = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok || verifyData?.status === 'FAILED') {
    throw new Error(verifyData?.message || 'Payment verification failed');
  }

  return {
    razorpayPaymentId: paymentResponse.razorpay_payment_id,
    razorpayOrderId: paymentResponse.razorpay_order_id,
    razorpaySignature: paymentResponse.razorpay_signature,
    amountPaise,
  };
};
