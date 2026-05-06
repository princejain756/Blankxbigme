import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OrderStore, sanitizeOrderForUser } from './order-store.mjs';
import { UserStore } from './user-store.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ORDER_STATUSES = new Set(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']);
const BIGME_PRODUCTS_URL = 'https://store.bigme.vip/products.json?limit=250';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Princeadmin23';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'a1rqwdxa14$@@$!@2';
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'blank-production-token-secret-change-this';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_SIsShw5slWk6ap';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8').trim();
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const withTimeout = async (promise, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await promise(controller.signal);
    return response;
  } finally {
    clearTimeout(timer);
  }
};

const isValidCreateOrderPayload = (body) => {
  if (!body || typeof body !== 'object') return false;
  if (!body.customer || typeof body.customer !== 'object') return false;
  if (!Array.isArray(body.items) || body.items.length === 0) return false;
  if (!body.totals || typeof body.totals !== 'object') return false;

  const name = String(body.customer.name ?? '').trim();
  const email = String(body.customer.email ?? '').trim();
  const phone = String(body.customer.phone ?? '').trim();
  const address = String(body.customer.address ?? '').trim();
  const total = Number(body.totals.total ?? 0);
  const paymentMethod = String(body.payment?.method ?? '').trim().toLowerCase();
  const paymentId = String(body.payment?.paymentId ?? '').trim();

  return Boolean(name && email && phone && address && total > 0 && paymentMethod === 'razorpay' && paymentId);
};

const hashPassword = (password, salt) => scryptSync(password, salt, 64).toString('hex');

const createToken = (payload) => {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const bodyBase64 = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const signature = createHmac('sha256', TOKEN_SECRET).update(bodyBase64).digest('base64url');
  return `${bodyBase64}.${signature}`;
};

const parseToken = (token) => {
  const [bodyBase64, signature] = String(token ?? '').split('.');
  if (!bodyBase64 || !signature) return null;

  const expected = createHmac('sha256', TOKEN_SECRET).update(bodyBase64).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(bodyBase64, 'base64url').toString('utf8'));
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

const getAuthPayload = (req) => {
  const header = String(req.headers.authorization ?? '');
  if (!header.startsWith('Bearer ')) return null;
  return parseToken(header.slice('Bearer '.length));
};

const requireRole = (req, role) => {
  const payload = getAuthPayload(req);
  if (!payload || payload.role !== role) return null;
  return payload;
};

const getRazorpayAuthHeader = () => {
  const token = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${token}`;
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const expected = createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (!signature || signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

export const createApiMiddleware = ({ dataFilePath, usersFilePath } = {}) => {
  const store = new OrderStore({
    filePath: dataFilePath || path.join(rootDir, 'data', 'orders.json'),
  });
  const users = new UserStore({
    filePath: usersFilePath || path.join(rootDir, 'data', 'users.json'),
  });

  return async (req, res, next) => {
    const origin = req.headers.origin ?? '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const host = req.headers.host || 'localhost';
    const reqUrl = new URL(req.url || '/', `http://${host}`);
    const pathname = reqUrl.pathname;

    if (pathname === '/api/health' && req.method === 'GET') {
      json(res, 200, { ok: true, service: 'blank-api' });
      return;
    }

    if (pathname === '/api/bigme/catalog' && req.method === 'GET') {
      try {
        const upstream = await withTimeout(
          (signal) =>
            fetch(BIGME_PRODUCTS_URL, {
              signal,
              headers: {
                Accept: 'application/json',
                'User-Agent': 'BLANK-Storefront/1.0 (+https://blank.cool)',
              },
            }),
          15000
        );

        if (!upstream.ok) {
          json(res, 502, { error: `Upstream store responded with ${upstream.status}` });
          return;
        }

        const data = await upstream.json();
        json(res, 200, data);
        return;
      } catch (error) {
        json(res, 502, {
          error: error instanceof Error ? error.message : 'Unable to fetch live catalog',
        });
        return;
      }
    }

    if (pathname === '/api/auth/admin/login' && req.method === 'POST') {
      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const username = String(body.username ?? '').trim();
      const password = String(body.password ?? '');
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        json(res, 401, { error: 'Invalid admin credentials' });
        return;
      }

      const token = createToken({ role: 'admin', username });
      json(res, 200, { token, user: { role: 'admin', username } });
      return;
    }

    if (pathname === '/api/payments/razorpay/order' && req.method === 'POST') {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        json(res, 500, { error: 'Razorpay server configuration is missing' });
        return;
      }

      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const amount = Number(body.amount ?? 0);
      const currency = String(body.currency ?? 'INR').toUpperCase();
      if (!Number.isFinite(amount) || amount < 100 || currency !== 'INR') {
        json(res, 400, { error: 'Invalid Razorpay order payload' });
        return;
      }

      const receipt = String(body.receipt ?? `receipt_${Date.now()}`).slice(0, 40);

      try {
        const upstream = await withTimeout(
          (signal) =>
            fetch('https://api.razorpay.com/v1/orders', {
              method: 'POST',
              signal,
              headers: {
                Authorization: getRazorpayAuthHeader(),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: Math.round(amount),
                currency,
                receipt,
                notes: body.notes && typeof body.notes === 'object' ? body.notes : undefined,
              }),
            }),
          15000
        );

        const raw = await upstream.text();
        const parsed = raw ? JSON.parse(raw) : {};
        if (!upstream.ok) {
          json(res, 502, { error: parsed?.error?.description || 'Failed to create Razorpay order' });
          return;
        }

        json(res, 200, {
          keyId: RAZORPAY_KEY_ID,
          orderId: parsed.id,
          amount: parsed.amount,
          currency: parsed.currency,
        });
        return;
      } catch (error) {
        json(res, 502, { error: error instanceof Error ? error.message : 'Razorpay order creation failed' });
        return;
      }
    }

    if (pathname === '/api/payments/razorpay/verify' && req.method === 'POST') {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        json(res, 500, { error: 'Razorpay server configuration is missing' });
        return;
      }

      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const razorpayOrderId = String(body.razorpayOrderId ?? '').trim();
      const razorpayPaymentId = String(body.razorpayPaymentId ?? '').trim();
      const razorpaySignature = String(body.razorpaySignature ?? '').trim();
      const orderPayload = body.orderPayload;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        json(res, 400, { error: 'Missing Razorpay verification fields' });
        return;
      }

      if (!verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
        json(res, 400, { error: 'Invalid Razorpay signature' });
        return;
      }

      if (!isValidCreateOrderPayload({
        ...orderPayload,
        payment: { method: 'razorpay', paymentId: razorpayPaymentId },
      })) {
        json(res, 400, { error: 'Missing required order fields' });
        return;
      }

      const finalPayload = {
        ...orderPayload,
        payment: {
          method: 'razorpay',
          paymentId: razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
        },
      };

      const auth = getAuthPayload(req);
      if (auth?.role === 'user') {
        const user = await users.findById(auth.userId);
        if (user) {
          finalPayload.customer.email = user.email || finalPayload.customer.email;
          finalPayload.customer.phone = user.phone || finalPayload.customer.phone;
          finalPayload.customer.name = finalPayload.customer.name || user.name;
          finalPayload.userId = user.id;
        }
      }

      const created = await store.createOrder(finalPayload);
      json(res, 201, {
        order: {
          id: created.id,
          createdAt: created.createdAt,
          status: created.status,
        },
      });
      return;
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const name = String(body.name ?? '').trim();
      const email = String(body.email ?? '').trim().toLowerCase();
      const phone = String(body.phone ?? '').trim();
      const password = String(body.password ?? '');

      if (!name || !(email || phone) || password.length < 8) {
        json(res, 400, { error: 'Name, contact (email or phone), and password (min 8 chars) are required' });
        return;
      }

      const salt = randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const created = await users.createUser({ name, email, phone, passwordHash, passwordSalt: salt });

      if (!created) {
        json(res, 409, { error: 'User already exists with this email or phone' });
        return;
      }

      const token = createToken({ role: 'user', userId: created.id });
      json(res, 201, {
        token,
        user: { id: created.id, name: created.name, email: created.email, phone: created.phone, role: 'user' },
      });
      return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const identity = String(body.identity ?? '').trim();
      const password = String(body.password ?? '');
      const user = await users.findByEmailOrPhone(identity);
      if (!user) {
        json(res, 401, { error: 'Invalid user credentials' });
        return;
      }

      const digest = hashPassword(password, user.passwordSalt);
      if (digest !== user.passwordHash) {
        json(res, 401, { error: 'Invalid user credentials' });
        return;
      }

      const token = createToken({ role: 'user', userId: user.id });
      json(res, 200, {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'user' },
      });
      return;
    }

    if (pathname === '/api/user/me' && req.method === 'GET') {
      const auth = requireRole(req, 'user');
      if (!auth) {
        json(res, 401, { error: 'Unauthorized user request' });
        return;
      }

      const user = await users.findById(auth.userId);
      if (!user) {
        json(res, 404, { error: 'User not found' });
        return;
      }

      json(res, 200, { user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'user' } });
      return;
    }

    if (pathname === '/api/user/orders' && req.method === 'GET') {
      const auth = requireRole(req, 'user');
      if (!auth) {
        json(res, 401, { error: 'Unauthorized user request' });
        return;
      }

      const user = await users.findById(auth.userId);
      if (!user) {
        json(res, 404, { error: 'User not found' });
        return;
      }

      const orders = await store.lookupOrders({ email: user.email, phone: user.phone });
      json(res, 200, { orders });
      return;
    }

    if (pathname === '/api/orders' && req.method === 'POST') {
      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      if (!isValidCreateOrderPayload(body)) {
        json(res, 400, { error: 'Missing required order fields' });
        return;
      }

      const auth = getAuthPayload(req);
      if (auth?.role === 'user') {
        const user = await users.findById(auth.userId);
        if (user) {
          body.customer.email = user.email || body.customer.email;
          body.customer.phone = user.phone || body.customer.phone;
          body.customer.name = body.customer.name || user.name;
          body.userId = user.id;
        }
      }

      const created = await store.createOrder(body);
      json(res, 201, {
        order: {
          id: created.id,
          createdAt: created.createdAt,
          status: created.status,
        },
      });
      return;
    }

    if (pathname === '/api/orders/lookup' && req.method === 'POST') {
      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const orders = await store.lookupOrders({
        email: body.email,
        phone: body.phone,
        orderId: body.orderId,
      });

      json(res, 200, { orders });
      return;
    }

    if (pathname === '/api/admin/orders' && req.method === 'GET') {
      const auth = requireRole(req, 'admin');
      if (!auth) {
        json(res, 401, { error: 'Unauthorized admin request' });
        return;
      }

      const orders = await store.listOrders();
      json(res, 200, { orders });
      return;
    }

    if (pathname.startsWith('/api/admin/orders/') && req.method === 'PATCH') {
      const auth = requireRole(req, 'admin');
      if (!auth) {
        json(res, 401, { error: 'Unauthorized admin request' });
        return;
      }

      const orderId = pathname.split('/').pop();
      const body = await readBody(req);
      if (body === null) {
        json(res, 400, { error: 'Invalid JSON body' });
        return;
      }

      const status = String(body.status ?? '').trim().toLowerCase();
      if (!ORDER_STATUSES.has(status)) {
        json(res, 400, { error: 'Invalid status value' });
        return;
      }

      const updated = await store.updateStatus(orderId, status);
      if (!updated) {
        json(res, 404, { error: 'Order not found' });
        return;
      }

      json(res, 200, { order: updated });
      return;
    }

    if (typeof next === 'function') {
      next();
      return;
    }

    json(res, 404, { error: 'API route not found' });
  };
};
