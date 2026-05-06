import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_DATA = { users: [] };

const normalizePhone = (value) => String(value ?? '').replace(/\D+/g, '');

export class UserStore {
  constructor({ filePath }) {
    this.filePath = filePath;
  }

  async #readData() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return { users: Array.isArray(parsed?.users) ? parsed.users : [] };
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

  async createUser({ name, email, phone, passwordHash, passwordSalt }) {
    const data = await this.#readData();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const exists = data.users.some(
      (user) =>
        (normalizedEmail && user.email === normalizedEmail) ||
        (normalizedPhone && normalizePhone(user.phone) === normalizedPhone)
    );

    if (exists) {
      return null;
    }

    const user = {
      id: randomUUID(),
      name: String(name ?? '').trim(),
      email: normalizedEmail,
      phone: String(phone ?? '').trim(),
      passwordHash,
      passwordSalt,
      createdAt: new Date().toISOString(),
    };

    data.users.push(user);
    await this.#writeData(data);
    return user;
  }

  async findByEmailOrPhone(value) {
    const data = await this.#readData();
    const normalizedEmail = String(value ?? '').trim().toLowerCase();
    const normalizedPhone = normalizePhone(value);

    return (
      data.users.find(
        (user) =>
          (normalizedEmail && user.email === normalizedEmail) ||
          (normalizedPhone && normalizePhone(user.phone) === normalizedPhone)
      ) || null
    );
  }

  async findById(userId) {
    const data = await this.#readData();
    return data.users.find((user) => user.id === userId) || null;
  }
}
