import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  UserRound,
} from 'lucide-react';
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
const CHECKOUT_PROFILE_KEY = 'blank_checkout_profile_v1';
const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidPhone = (value: string) => value.replace(/\D+/g, '').length >= 10;

type CheckoutProfile = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

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

  const completedFields = [
    Boolean(name.trim()),
    isValidEmail(email),
    isValidPhone(phone),
    address.trim().length >= 10,
  ].filter(Boolean).length;

  const checkoutProgress = Math.round((completedFields / 4) * 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totals.subtotal, 0);
  const primaryPayLabel = isSubmitting
    ? 'Opening Razorpay'
    : isFormValid
      ? `Pay ${formatPrice(totals.total)}`
      : 'Add delivery details';

  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(CHECKOUT_PROFILE_KEY);
      if (!rawProfile) return;
      const savedProfile = JSON.parse(rawProfile) as CheckoutProfile;
      setName(savedProfile.name ?? '');
      setEmail(savedProfile.email ?? '');
      setPhone(savedProfile.phone ?? '');
      setAddress(savedProfile.address ?? '');
    } catch {
      // Ignore saved checkout details if the browser storage payload is invalid.
    }
  }, []);

  useEffect(() => {
    if (!name && !email && !phone && !address) return;

    try {
      const profile: CheckoutProfile = { name, email, phone, address };
      window.localStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Checkout can continue even if browser storage is unavailable.
    }
  }, [address, email, name, phone]);

  useEffect(() => {
    const target = inlinePayButtonRef.current;
    if (!target) return;

    let frameId = 0;
    const updateStickyPay = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setShowMobileStickyPay(target.getBoundingClientRect().top < 0);
      });
    };

    updateStickyPay();
    window.addEventListener('scroll', updateStickyPay, { passive: true });
    window.addEventListener('resize', updateStickyPay);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateStickyPay);
      window.removeEventListener('resize', updateStickyPay);
    };
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
    <div className="min-h-screen px-4 pb-[10rem] pt-24 sm:px-6 md:pb-20 md:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-cocoa-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-cocoa-900 shadow-sm transition-colors hover:bg-cocoa-50 dark:border-cocoa-700 dark:bg-cocoa-900/80 dark:text-white dark:hover:bg-cocoa-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 sm:inline-flex">
            <LockKeyhole className="h-4 w-4" />
            Secure Razorpay checkout
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-cocoa-100 bg-white shadow-[0_22px_70px_-48px_rgba(43,33,27,0.7)] dark:border-cocoa-800 dark:bg-cocoa-900/70">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr),minmax(360px,0.9fr)]">
            <section className="min-w-0 border-b border-cocoa-100 p-5 dark:border-cocoa-800 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cocoa-500 dark:text-cocoa-400">
                    Checkout
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-cocoa-950 dark:text-white md:text-4xl">
                    Fast, simple delivery
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cocoa-600 dark:text-cocoa-300 md:text-base">
                    Your saved details are prefilled on this device, then Razorpay handles UPI, cards, netbanking, and wallets.
                  </p>
                </div>

                <div className="min-w-[150px] rounded-xl border border-cocoa-100 bg-cocoa-50 p-3 dark:border-cocoa-800 dark:bg-cocoa-950/60">
                  <div className="flex items-center justify-between text-xs font-medium text-cocoa-600 dark:text-cocoa-300">
                    <span>Ready</span>
                    <span>{checkoutProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-cocoa-900">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${checkoutProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {successOrderId && (
                <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" /> Order placed successfully
                  </div>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                    Order ID: <span className="font-semibold">{successOrderId}</span>
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="group block text-sm font-medium text-cocoa-800 dark:text-cocoa-100">
                  Full name
                  <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-cocoa-200 bg-white px-3 transition-colors focus-within:border-cocoa-500 focus-within:ring-4 focus-within:ring-cocoa-100 dark:border-cocoa-700 dark:bg-cocoa-950 dark:focus-within:ring-cocoa-800/60">
                    <UserRound className="h-4 w-4 shrink-0 text-cocoa-400" />
                    <input
                      className="w-full bg-transparent py-3 text-base text-cocoa-950 outline-none placeholder:text-cocoa-300 dark:text-cocoa-50 dark:placeholder:text-cocoa-600"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="Prince Kumar"
                      aria-invalid={!name.trim()}
                    />
                  </div>
                </label>

                <label className="group block text-sm font-medium text-cocoa-800 dark:text-cocoa-100">
                  Phone
                  <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-cocoa-200 bg-white px-3 transition-colors focus-within:border-cocoa-500 focus-within:ring-4 focus-within:ring-cocoa-100 dark:border-cocoa-700 dark:bg-cocoa-950 dark:focus-within:ring-cocoa-800/60">
                    <Phone className="h-4 w-4 shrink-0 text-cocoa-400" />
                    <input
                      className="w-full bg-transparent py-3 text-base text-cocoa-950 outline-none placeholder:text-cocoa-300 dark:text-cocoa-50 dark:placeholder:text-cocoa-600"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+91 80056 34678"
                      aria-invalid={Boolean(phone) && !isValidPhone(phone)}
                    />
                  </div>
                </label>

                <label className="group block text-sm font-medium text-cocoa-800 dark:text-cocoa-100 sm:col-span-2">
                  Email
                  <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-cocoa-200 bg-white px-3 transition-colors focus-within:border-cocoa-500 focus-within:ring-4 focus-within:ring-cocoa-100 dark:border-cocoa-700 dark:bg-cocoa-950 dark:focus-within:ring-cocoa-800/60">
                    <Mail className="h-4 w-4 shrink-0 text-cocoa-400" />
                    <input
                      type="email"
                      className="w-full bg-transparent py-3 text-base text-cocoa-950 outline-none placeholder:text-cocoa-300 dark:text-cocoa-50 dark:placeholder:text-cocoa-600"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      aria-invalid={Boolean(email) && !isValidEmail(email)}
                    />
                  </div>
                </label>

                <label className="group block text-sm font-medium text-cocoa-800 dark:text-cocoa-100 sm:col-span-2">
                  Delivery address
                  <div className="mt-2 flex items-start gap-3 rounded-xl border border-cocoa-200 bg-white px-3 transition-colors focus-within:border-cocoa-500 focus-within:ring-4 focus-within:ring-cocoa-100 dark:border-cocoa-700 dark:bg-cocoa-950 dark:focus-within:ring-cocoa-800/60">
                    <MapPin className="mt-3.5 h-4 w-4 shrink-0 text-cocoa-400" />
                    <textarea
                      className="min-h-28 w-full resize-y bg-transparent py-3 text-base text-cocoa-950 outline-none placeholder:text-cocoa-300 dark:text-cocoa-50 dark:placeholder:text-cocoa-600"
                      rows={4}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      autoComplete="street-address"
                      placeholder="House / flat, street, area, city, PIN"
                      aria-invalid={Boolean(address) && address.trim().length < 10}
                    />
                  </div>
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-cocoa-100 bg-cocoa-50 px-3 py-3 text-sm text-cocoa-700 dark:border-cocoa-800 dark:bg-cocoa-950/60 dark:text-cocoa-200">
                  <Smartphone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  UPI ready
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-cocoa-100 bg-cocoa-50 px-3 py-3 text-sm text-cocoa-700 dark:border-cocoa-800 dark:bg-cocoa-950/60 dark:text-cocoa-200">
                  <CreditCard className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                  Cards accepted
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-cocoa-100 bg-cocoa-50 px-3 py-3 text-sm text-cocoa-700 dark:border-cocoa-800 dark:bg-cocoa-950/60 dark:text-cocoa-200">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                  Verified payment
                </div>
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
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cocoa-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cocoa-950/15 transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:bg-white dark:text-cocoa-950 dark:hover:bg-cocoa-100 sm:w-auto"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                {primaryPayLabel} with Razorpay
              </button>
            </section>

            <aside className="bg-cocoa-50/70 p-5 dark:bg-cocoa-950/50 sm:p-7">
              <div className="lg:sticky lg:top-28">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cocoa-500 dark:text-cocoa-400">
                      Summary
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-cocoa-950 dark:text-white">Your order</h2>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm dark:bg-cocoa-900">
                    <div className="text-xs text-cocoa-500 dark:text-cocoa-400">Total</div>
                    <div className="text-lg font-semibold text-cocoa-950 dark:text-white">{formatPrice(totals.total)}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[4.5rem,1fr,auto] items-center gap-3 rounded-xl border border-cocoa-100 bg-white p-3 dark:border-cocoa-800 dark:bg-cocoa-900/80"
                    >
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-cocoa-50 dark:bg-cocoa-950">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <ShoppingBagFallback />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-semibold text-cocoa-950 dark:text-cocoa-50">
                          {item.product.name}
                        </div>
                        <div className="mt-1 text-xs text-cocoa-500 dark:text-cocoa-400">Qty {item.quantity}</div>
                      </div>
                      <div className="text-sm font-semibold text-cocoa-950 dark:text-cocoa-50">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="rounded-xl border border-cocoa-100 bg-white p-4 text-sm text-cocoa-500 dark:border-cocoa-800 dark:bg-cocoa-900/80 dark:text-cocoa-300">
                      Cart is empty.
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-xl border border-cocoa-100 bg-white p-4 dark:border-cocoa-800 dark:bg-cocoa-900/80">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-cocoa-700 dark:text-cocoa-300">
                      <span>Subtotal</span>
                      <span>{formatPrice(totals.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-cocoa-700 dark:text-cocoa-300">
                      <span>Shipping</span>
                      <span>{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span>
                    </div>
                    <div className="border-t border-cocoa-100 pt-3 dark:border-cocoa-800">
                      <div className="flex items-center justify-between text-lg font-semibold text-cocoa-950 dark:text-white">
                        <span>Pay today</span>
                        <span>{formatPrice(totals.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      {totals.shipping === 0
                        ? 'Free shipping applied.'
                        : `${formatPrice(remainingForFreeShipping)} more unlocks free shipping.`}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showMobileStickyPay && (
        <div className="fixed inset-x-0 bottom-20 z-[70] border-t border-cocoa-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(43,33,27,0.12)] backdrop-blur dark:border-cocoa-800 dark:bg-cocoa-950/95 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-cocoa-500 dark:text-cocoa-400">Pay today</div>
              <div className="truncate text-lg font-semibold text-cocoa-950 dark:text-white">{formatPrice(totals.total)}</div>
            </div>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={!isFormValid || isSubmitting}
              className="inline-flex min-h-12 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-cocoa-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-cocoa-950 dark:hover:bg-cocoa-100"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              {isFormValid ? 'One tap pay' : 'Fill details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingBagFallback = () => (
  <div className="flex h-full w-full items-center justify-center text-cocoa-400 dark:text-cocoa-600">
    <CreditCard className="h-5 w-5" />
  </div>
);

export default CheckoutPage;
