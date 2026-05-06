import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { CartItem } from '../types';
import { FREE_SHIPPING_THRESHOLD, SITE_DETAILS } from '../constants';

interface CheckoutPageProps {
  items: CartItem[];
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const parseJsonResponse = async (response: Response) => {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    if (raw.trimStart().startsWith('<')) {
      throw new Error('API returned HTML instead of JSON. Please configure /api/orders on the server.');
    }
    throw new Error('Server returned an invalid JSON payload.');
  }
};

const USER_TOKEN_KEY = 'blank_user_token_v1';
const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidPhone = (value: string) => value.replace(/\D+/g, '').length >= 10;

const loadRazorpay = async () => {
  if ((window as any).Razorpay) return true;

  return await new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage: React.FC<CheckoutPageProps> = ({ items, onBack, onOrderPlaced }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const inlinePayButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showMobileStickyPay, setShowMobileStickyPay] = useState(true);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 120;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [items]);

  const isFormValid = Boolean(
    name.trim() &&
      address.trim().length >= 10 &&
      isValidEmail(email) &&
      isValidPhone(phone) &&
      items.length > 0 &&
      totals.total > 0
  );

  useEffect(() => {
    const target = inlinePayButtonRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyPay(!entry.isIntersecting);
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const buildOrderPayload = () => ({
    customer: {
      name,
      email,
      phone,
      address,
    },
    items: items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    })),
    totals,
  });

  const createRazorpayOrder = async () => {
    const response = await fetch('/api/payments/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(totals.total * 100),
        currency: 'INR',
        notes: {
          customerName: name,
          customerEmail: email,
        },
      }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data?.error || 'Failed to initialize Razorpay order');
    return data as { keyId: string; orderId: string; amount: number; currency: string };
  };

  const verifyPaymentAndCreateOrder = async ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(window.localStorage.getItem(USER_TOKEN_KEY)
          ? { Authorization: `Bearer ${window.localStorage.getItem(USER_TOKEN_KEY)}` }
          : {}),
      },
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        orderPayload: buildOrderPayload(),
      }),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data?.error || 'Failed to place order');
    const orderId = String(data?.order?.id ?? '');
    if (!orderId) throw new Error('Order ID was not returned by the server');
    return orderId;
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (!isFormValid) {
      setError('All details are mandatory: full name, valid email, valid phone, full address, and cart items.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const razorpayReady = await loadRazorpay();
      if (!razorpayReady) {
        throw new Error('Unable to load Razorpay. Please try again.');
      }

      const razorpayServerOrder = await createRazorpayOrder();
      const options = {
        key: razorpayServerOrder.keyId || (SITE_DETAILS as any).razorpayKeyId,
        order_id: razorpayServerOrder.orderId,
        amount: razorpayServerOrder.amount,
        currency: razorpayServerOrder.currency,
        name: 'BLANK',
        description: 'Order payment',
        handler: async (response: any) => {
          try {
            const orderId = await verifyPaymentAndCreateOrder({
              razorpayOrderId: String(response?.razorpay_order_id ?? ''),
              razorpayPaymentId: String(response?.razorpay_payment_id ?? ''),
              razorpaySignature: String(response?.razorpay_signature ?? ''),
            });
            setSuccessOrderId(orderId);
            onOrderPlaced(orderId);
            setIsSubmitting(false);
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Failed to place order');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: '#2b211b',
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      return;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-28 pb-36 md:pt-32 md:pb-20">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-cocoa-300 bg-white/90 px-5 py-3 text-sm font-medium text-cocoa-900 shadow-sm transition-colors hover:bg-cocoa-100 dark:border-cocoa-700 dark:bg-cocoa-900/80 dark:text-white dark:hover:bg-cocoa-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-cocoa-800 dark:bg-cocoa-900/70">
            <h1 className="text-4xl font-medium text-cocoa-950 dark:text-white">Checkout</h1>
            <p className="mt-3 text-cocoa-600 dark:text-cocoa-300">
              Fill your delivery details to place the order from this server database.
            </p>

            {successOrderId && (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" /> Order placed successfully
                </div>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                  Order ID: <span className="font-semibold">{successOrderId}</span>
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-cocoa-700 dark:text-cocoa-200">
                Full Name
                <input
                  className="mt-2 w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="block text-sm text-cocoa-700 dark:text-cocoa-200">
                Email
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className="block text-sm text-cocoa-700 dark:text-cocoa-200">
                Phone
                <input
                  className="mt-2 w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label className="block text-sm text-cocoa-700 dark:text-cocoa-200 md:col-span-2">
                Address
                <textarea
                  className="mt-2 w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
                  rows={4}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              ref={inlinePayButtonRef}
              type="button"
              onClick={handlePlaceOrder}
              disabled={!isFormValid || isSubmitting}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cocoa-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay Now
            </button>
          </section>

          <section className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-cocoa-800 dark:bg-cocoa-900/70">
            <h2 className="text-2xl font-medium text-cocoa-950 dark:text-white">Order Summary</h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-cocoa-900 dark:text-cocoa-100">{item.product.name}</div>
                    <div className="text-xs text-cocoa-500 dark:text-cocoa-400">Qty {item.quantity}</div>
                  </div>
                  <div className="text-sm font-medium text-cocoa-900 dark:text-cocoa-100">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}

              {items.length === 0 && <p className="text-sm text-cocoa-500 dark:text-cocoa-400">Cart is empty.</p>}
            </div>

            <div className="mt-6 space-y-2 border-t border-cocoa-200 pt-4 dark:border-cocoa-700">
              <div className="flex items-center justify-between text-sm text-cocoa-700 dark:text-cocoa-300">
                <span>Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-cocoa-700 dark:text-cocoa-300">
                <span>Shipping</span>
                <span>{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-medium text-cocoa-900 dark:text-white">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showMobileStickyPay && (
      <div className="fixed inset-x-0 bottom-20 z-[70] border-t border-cocoa-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(43,33,27,0.12)] backdrop-blur dark:border-cocoa-800 dark:bg-cocoa-950/95 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-cocoa-500 dark:text-cocoa-400">Total</div>
            <div className="text-lg font-semibold text-cocoa-950 dark:text-white">{formatPrice(totals.total)}</div>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!isFormValid || isSubmitting}
            className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-cocoa-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-cocoa-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pay Now
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default CheckoutPage;
