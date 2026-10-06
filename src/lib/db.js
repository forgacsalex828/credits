// Egyszerű, fájl alapú JSON adatbázis. A kreditek GLOBÁLISAK:
// a felhasználó egyenlege ugyanaz minden szerveren, ahol a bot jelen van.
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_FILE = join(DATA_DIR, 'credits.json');

const DAY_MS = 24 * 60 * 60 * 1000;

export class CreditStore {
  constructor(file = DB_FILE, { startingBalance = 0 } = {}) {
    this.file = file;
    this.startingBalance = startingBalance;
    this.data = { users: {} };
    this.load();
  }

  load() {
    mkdirSync(dirname(this.file), { recursive: true });
    if (existsSync(this.file)) {
      try {
        this.data = JSON.parse(readFileSync(this.file, 'utf8'));
        this.data.users ??= {};
      } catch (err) {
        console.error('Nem sikerült beolvasni az adatbázist, új indul:', err.message);
        this.data = { users: {} };
      }
    }
  }

  save() {
    // Atomikus írás: először ideiglenes fájlba, majd átnevezés.
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    renameSync(tmp, this.file);
  }

  user(id) {
    if (!this.data.users[id]) {
      this.data.users[id] = { balance: this.startingBalance, lastDaily: 0 };
    }
    return this.data.users[id];
  }

  balance(id) {
    return this.user(id).balance;
  }

  add(id, amount) {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Az összegnek pozitív egész számnak kell lennie.');
    const u = this.user(id);
    u.balance += amount;
    this.save();
    return u.balance;
  }

  remove(id, amount) {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Az összegnek pozitív egész számnak kell lennie.');
    const u = this.user(id);
    if (u.balance < amount) throw new Error('Nincs elég kredit.');
    u.balance -= amount;
    this.save();
    return u.balance;
  }

  transfer(fromId, toId, amount) {
    if (fromId === toId) throw new Error('Magadnak nem küldhetsz kreditet.');
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Az összegnek pozitív egész számnak kell lennie.');
    const from = this.user(fromId);
    if (from.balance < amount) throw new Error(`Nincs elég kredited (egyenleg: ${from.balance}).`);
    const to = this.user(toId);
    from.balance -= amount;
    to.balance += amount;
    this.save();
    return { from: from.balance, to: to.balance };
  }

  /** Napi jutalom. Visszaadja az új egyenleget, vagy a hátralévő ms-t, ha még nem jár. */
  claimDaily(id, reward) {
    const u = this.user(id);
    const now = Date.now();
    const remaining = u.lastDaily + DAY_MS - now;
    if (remaining > 0) return { ok: false, remaining };
    u.lastDaily = now;
    u.balance += reward;
    this.save();
    return { ok: true, balance: u.balance };
  }

  top(limit = 10) {
    return Object.entries(this.data.users)
      .map(([id, u]) => ({ id, balance: u.balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }
}
