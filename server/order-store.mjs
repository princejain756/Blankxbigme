import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_DATA = { orders: [] };

const normalizePhone = (value) => String(value ?? '').replace(/\D+/g, '');

export const sanitizeOrderForUser = (order) => ({
  id: order.id,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  status: order.status,
  customer: {
    name: order.customer?.name ?? '',
    email: order.customer?.email ?? '',
    phone: order.customer?.phone ?? '',
    address: order.customer?.address ?? '',
  },
  items: order.items ?? [],
  totals: order.totals ?? { subtotal: 0, shipping: 0, total: 0, currency: 'INR' },
  payment: order.payment ?? { method: 'manual' },
});

export class OrderStore {
  constructor({ filePath }) {
    this.filePath = filePath;
  }

  async #readData() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        await this.#writeData(DEFAULT_DATA);
        return { ...DEFAULT_DATA };
      }
      throw error;
    }
  }

  async #writeData(data) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async listOrders() {
    const data = await this.#readData();
    return [...data.orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async createOrder(input) {
    const data = await this.#readData();
    const now = new Date().toISOString();
    const id = `BLK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = {
      id,
      createdAt: now,
      updatedAt: now,
      status: 'pending',
      customer: {
        name: String(input.customer?.name ?? '').trim(),
        email: String(input.customer?.email ?? '').trim().toLowerCase(),
        phone: String(input.customer?.phone ?? '').trim(),
        address: String(input.customer?.address ?? '').trim(),
      },
      items: Array.isArray(input.items)
        ? input.items.map((item) => ({
            id: String(item.id ?? ''),
            name: String(item.name ?? 'Product'),
            price: Number(item.price ?? 0),
            quantity: Math.max(1, Number(item.quantity ?? 1)),
            image: String(item.image ?? ''),
          }))
        : [],
      totals: {
        subtotal: Number(input.totals?.subtotal ?? 0),
        shipping: Number(input.totals?.shipping ?? 0),
        total: Number(input.totals?.total ?? 0),
        currency: 'INR',
      },
      payment: {
        method: String(input.payment?.method ?? 'manual'),
        paymentId: input.payment?.paymentId ? String(input.payment.paymentId) : undefined,
        razorpayOrderId: input.payment?.razorpayOrderId ? String(input.payment.razorpayOrderId) : undefined,
        razorpaySignature: input.payment?.razorpaySignature ? String(input.payment.razorpaySignature) : undefined,
      },
    };

    data.orders.push(order);
    await this.#writeData(data);
    return order;
  }

  async updateStatus(orderId, status) {
    const data = await this.#readData();
    const order = data.orders.find((entry) => entry.id === orderId);
    if (!order) {
      return null;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    await this.#writeData(data);
    return order;
  }

  async lookupOrders({ email, phone, orderId }) {
    const data = await this.#readData();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    const normalizedOrderId = String(orderId ?? '').trim().toUpperCase();

    const filtered = data.orders.filter((order) => {
      if (normalizedOrderId && String(order.id).toUpperCase() !== normalizedOrderId) {
        return false;
      }

      if (normalizedEmail && String(order.customer?.email ?? '').toLowerCase() !== normalizedEmail) {
        return false;
      }

      if (normalizedPhone && normalizePhone(order.customer?.phone) !== normalizedPhone) {
        return false;
      }

      if (!normalizedOrderId && !normalizedEmail && !normalizedPhone) {
        return false;
      }

      return true;
    });

    return filtered
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(sanitizeOrderForUser);
  }
}
