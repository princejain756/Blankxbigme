import React, { useState } from 'react';
import { Loader2, LogIn, RefreshCw } from 'lucide-react';
import { AdminOrder, OrderStatus } from '../types';
import { downloadInvoice } from './invoice';

const ADMIN_TOKEN_KEY = 'blank_admin_token_v1';
const STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

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
    throw new Error('Server returned an invalid response.');
  }
};

const AdminPanelPage: React.FC = () => {
  const [username, setUsername] = useState('Princeadmin23');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string>(() => window.localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Admin login failed');

      const nextToken = String(data?.token || '');
      if (!nextToken) throw new Error('No admin token was returned');
      setToken(nextToken);
      window.localStorage.setItem(ADMIN_TOKEN_KEY, nextToken);
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setOrders([]);
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  const loadOrders = async () => {
    if (!token) {
      setError('Please login as admin first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Failed to load orders');
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Failed to update status');
      setOrders((prev) => prev.map((order) => (order.id === orderId ? data.order : order)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <section className="rounded-[2rem] border border-cocoa-200 bg-white p-8 shadow-sm dark:border-cocoa-800 dark:bg-cocoa-900/70">
          <h1 className="text-4xl font-medium text-cocoa-950 dark:text-white">Admin Panel</h1>
          <p className="mt-3 text-cocoa-600 dark:text-cocoa-300">Production admin login and order management.</p>

          {!token ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Admin ID"
                className="rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="rounded-xl border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 outline-none focus:border-cocoa-400 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
              />
              <button
                type="button"
                onClick={login}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa-900 px-5 py-3 text-sm font-medium text-white hover:bg-cocoa-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Login
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa-900 px-5 py-3 text-sm font-medium text-white hover:bg-cocoa-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Load Orders
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-cocoa-300 px-5 py-3 text-sm font-medium text-cocoa-800 dark:border-cocoa-700 dark:text-cocoa-200"
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium text-cocoa-900 dark:text-cocoa-100">{order.id}</h2>
                  <p className="text-sm text-cocoa-500 dark:text-cocoa-400">
                    {order.customer?.name || 'Customer'} · {order.customer?.email || order.customer?.phone || 'No contact'}
                  </p>
                  <p className="text-sm text-cocoa-500 dark:text-cocoa-400">Phone: {order.customer?.phone || '-'}</p>
                  <p className="text-sm text-cocoa-500 dark:text-cocoa-400">Address: {order.customer?.address || '-'}</p>
                  <p className="text-sm text-cocoa-500 dark:text-cocoa-400">
                    Payment: {order.payment?.method || '-'} {order.payment?.paymentId ? `• ${order.payment.paymentId}` : ''}
                  </p>
                  <p className="text-sm text-cocoa-500 dark:text-cocoa-400">Total {formatPrice(order.totals?.total ?? 0)}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
                    className="rounded-lg border border-cocoa-300 bg-white px-3 py-2 text-sm text-cocoa-900 dark:border-cocoa-700 dark:bg-cocoa-950 dark:text-cocoa-100"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => downloadInvoice(order)}
                    className="rounded-lg bg-cocoa-900 px-3 py-2 text-xs font-medium text-white hover:bg-cocoa-800"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cocoa-200 p-3 dark:border-cocoa-700">
                <div className="text-xs uppercase tracking-wider text-cocoa-500 dark:text-cocoa-400">Items</div>
                <div className="mt-2 space-y-1 text-sm text-cocoa-700 dark:text-cocoa-200">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.id}`} className="flex items-center justify-between">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}

          {!loading && token && orders.length === 0 && (
            <div className="rounded-2xl border border-cocoa-200 bg-white p-6 text-sm text-cocoa-500 dark:border-cocoa-800 dark:bg-cocoa-900/70 dark:text-cocoa-300">
              No orders loaded.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminPanelPage;
