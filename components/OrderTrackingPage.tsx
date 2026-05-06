import React, { useEffect, useState } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { PublicOrder } from '../types';
import { downloadInvoice } from './invoice';

const USER_TOKEN_KEY = 'blank_user_token_v1';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const parseJsonResponse = async (response: Response) => {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Server returned an invalid response.');
  }
};

const OrderTrackingPage: React.FC = () => {
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string>(() => window.localStorage.getItem(USER_TOKEN_KEY) || '');
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (authToken = token) => {
    if (!authToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/orders', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Failed to load orders');
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadOrders(token);
    }
  }, [token]);

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: identity, phone, password }),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Registration failed');

      const nextToken = String(data?.token || '');
      if (!nextToken) throw new Error('No token returned by server');
      setToken(nextToken);
      window.localStorage.setItem(USER_TOKEN_KEY, nextToken);
      setPassword('');
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, password }),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Login failed');

      const nextToken = String(data?.token || '');
      if (!nextToken) throw new Error('No token returned by server');
      setToken(nextToken);
      window.localStorage.setItem(USER_TOKEN_KEY, nextToken);
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setOrders([]);
    window.localStorage.removeItem(USER_TOKEN_KEY);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <section className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-cocoa-800 dark:bg-cocoa-900/70">
          <h1 className="text-4xl font-medium text-cocoa-950 dark:text-white">User Account & Order Tracking</h1>
          <p className="mt-3 text-cocoa-600 dark:text-cocoa-300">Create account or sign in to track your orders securely.</p>

          {!token ? (
            <div className="mt-6 grid gap-4">
              <input
                placeholder="Full name (for signup)"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
              />
              <input
                placeholder="Email or phone"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                className="w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
              />
              <input
                placeholder="Phone (for signup)"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-cocoa-900 px-5 py-3 text-sm font-medium text-white hover:bg-cocoa-800 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign In
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-cocoa-300 px-5 py-3 text-sm font-medium text-cocoa-900 hover:bg-cocoa-50 disabled:opacity-50 dark:border-cocoa-700 dark:text-cocoa-100 dark:hover:bg-cocoa-800"
                >
                  <UserPlus className="h-4 w-4" /> Create Account
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadOrders()}
                className="rounded-xl bg-cocoa-900 px-5 py-3 text-sm font-medium text-white hover:bg-cocoa-800"
              >
                Refresh Orders
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-cocoa-300 px-5 py-3 text-sm font-medium text-cocoa-900 dark:border-cocoa-700 dark:text-cocoa-100"
              >
                Logout
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        </section>

        <section className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-cocoa-200 bg-white p-6 shadow-sm dark:border-cocoa-800 dark:bg-cocoa-900/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium text-cocoa-900 dark:text-cocoa-100">{order.id}</h2>
                  <p className="text-sm text-cocoa-500 dark:text-cocoa-400">Placed {formatDate(order.createdAt)}</p>
                </div>
                <span className="rounded-full border border-cocoa-300 px-3 py-1 text-xs uppercase tracking-wider text-cocoa-700 dark:border-cocoa-600 dark:text-cocoa-200">
                  {order.status}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-cocoa-700 dark:text-cocoa-300">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.id}`} className="flex items-center justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-cocoa-200 pt-3 text-sm font-medium text-cocoa-900 dark:border-cocoa-700 dark:text-cocoa-100">
                Total: {formatPrice(order.totals.total)}
              </div>
              <button
                type="button"
                onClick={() => downloadInvoice(order)}
                className="mt-3 rounded-lg bg-cocoa-900 px-3 py-2 text-xs font-medium text-white hover:bg-cocoa-800"
              >
                Download Invoice
              </button>
            </article>
          ))}

          {!isLoading && token && orders.length === 0 && (
            <div className="rounded-2xl border border-cocoa-200 bg-white p-6 text-sm text-cocoa-500 dark:border-cocoa-800 dark:bg-cocoa-900/70 dark:text-cocoa-300">
              No orders found for this account yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
