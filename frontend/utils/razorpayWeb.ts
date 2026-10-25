// Razorpay Checkout for the web build (native uses react-native-razorpay)
export const loadRazorpayWebScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const openRazorpayWeb = (options: any): Promise<any> =>
  new Promise((resolve, reject) => {
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      reject(new Error('Razorpay SDK not available'));
      return;
    }
    const rzp = new RazorpayCtor({
      ...options,
      handler: (response: any) => resolve(response),
      modal: {
        ondismiss: () => reject({ code: 'PAYMENT_CANCELLED', description: 'User cancelled payment' }),
      },
    });
    rzp.on('payment.failed', (resp: any) => {
      reject(resp?.error || new Error('Payment failed'));
    });
    rzp.open();
  });
