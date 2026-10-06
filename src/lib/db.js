// SQLite adatbázis (better-sqlite3). Minden adat egy fájlban: data/meteor.sqlite
// A kreditek, a bolt és az inventory GLOBÁLISAK (minden szerveren közösek),
// a beállítások, figyelmeztetések és az XP szerverenkéntiek.
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_FILE = join(__dirname, '..', '..', 'data', 'meteor.sqlite');
const DAY_MS = 24 * 60 * 60 * 1000;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  last_daily INTEGER NOT NULL DEFAULT 0,
  last_work INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id TEXT,
  to_id TEXT,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_id);
CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_id);
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  log_channel TEXT,
  welcome_channel TEXT,
  welcome_message TEXT,
  antispam INTEGER NOT NULL DEFAULT 1,
  antispam_limit INTEGER NOT NULL DEFAULT 6,
  antispam_window INTEGER NOT NULL DEFAULT 5,
  antispam_timeout INTEGER NOT NULL DEFAULT 300,
  antilink INTEGER NOT NULL DEFAULT 0,
  antiinvite INTEGER NOT NULL DEFAULT 1,
  badwords TEXT NOT NULL DEFAULT '[]',
  antiraid INTEGER NOT NULL DEFAULT 1,
  antiraid_joins INTEGER NOT NULL DEFAULT 8,
  antiraid_window INTEGER NOT NULL DEFAULT 10,
  antiraid_action TEXT NOT NULL DEFAULT 'kick',
  min_account_age INTEGER NOT NULL DEFAULT 0,
  xp_enabled INTEGER NOT NULL DEFAULT 1,
  levelup_channel TEXT,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_warn ON warnings(guild_id, user_id);
CREATE TABLE IF NOT EXISTS guild_xp (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  messages INTEGER NOT NULL DEFAULT 0,
  last_xp INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);
CREATE TABLE IF NOT EXISTS mod_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT,
  moderator_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mod ON mod_actions(guild_id, created_at);
CREATE TABLE IF NOT EXISTS web_sessions (
  sid TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires INTEGER NOT NULL
);
`;

const DEFAULT_ITEMS = [
  { id: 'coffee', name: 'Kávé', emoji: '☕', price: 50, description: 'Egy forró kávé. Semmire se jó, de finom.' },
  { id: 'meteorite', name: 'Meteorit', emoji: '☄️', price: 500, description: 'Egy valódi darab az űrből.' },
  { id: 'rocket', name: 'Rakéta', emoji: '🚀', price: 2500, description: 'Oda repít, ahová csak akarsz.' },
  { id: 'crown', name: 'Korona', emoji: '👑', price: 10000, description: 'A leggazdagabbak státuszszimbóluma.' },
  { id: 'planet', name: 'Bolygó', emoji: '🪐', price: 50000, description: 'Egy saját bolygó. Mi kell még?' },
];

export const LEVEL_XP = (level) => 5 * level * level + 50 * level + 100;

export class MeteorDB {
  constructor(file = DB_FILE) {
    mkdirSync(dirname(file), { recursive: true });
    this.db = new Database(file);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);
    this.seedItems();
    this.prepare();
  }

  seedItems() {
    const ins = this.db.prepare('INSERT OR IGNORE INTO items (id, name, emoji, price, description) VALUES (@id, @name, @emoji, @price, @description)');
    for (const it of DEFAULT_ITEMS) ins.run(it);
  }

  prepare() {
    const q = (sql) => this.db.prepare(sql);
    this.q = {
      getUser: q('SELECT * FROM users WHERE id = ?'),
      insertUser: q('INSERT OR IGNORE INTO users (id, balance, created_at) VALUES (?, ?, ?)'),
      addBalance: q('UPDATE users SET balance = balance + ? WHERE id = ?'),
      setLastDaily: q('UPDATE users SET last_daily = ? WHERE id = ?'),
      setLastWork: q('UPDATE users SET last_work = ? WHERE id = ?'),
      top: q('SELECT id, balance FROM users ORDER BY balance DESC LIMIT ?'),
      countUsers: q('SELECT COUNT(*) AS n FROM users'),
      totalCredits: q('SELECT COALESCE(SUM(balance), 0) AS n FROM users'),
      insertTx: q('INSERT INTO transactions (from_id, to_id, amount, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
      txHistory: q('SELECT * FROM transactions WHERE from_id = ? OR to_id = ? ORDER BY id DESC LIMIT ?'),
      items: q('SELECT * FROM items ORDER BY price ASC'),
      item: q('SELECT * FROM items WHERE id = ?'),
      addInv: q('INSERT INTO inventory (user_id, item_id, qty) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET qty = qty + excluded.qty'),
      inv: q('SELECT i.*, inv.qty FROM inventory inv JOIN items i ON i.id = inv.item_id WHERE inv.user_id = ? AND inv.qty > 0 ORDER BY i.price DESC'),
      getSettings: q('SELECT * FROM guild_settings WHERE guild_id = ?'),
      insertSettings: q('INSERT OR IGNORE INTO guild_settings (guild_id, updated_at) VALUES (?, ?)'),
      addWarn: q('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)'),
      warns: q('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC'),
      delWarn: q('DELETE FROM warnings WHERE id = ? AND guild_id = ?'),
      clearWarns: q('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?'),
      addMod: q('INSERT INTO mod_actions (guild_id, user_id, moderator_id, action, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
      modLog: q('SELECT * FROM mod_actions WHERE guild_id = ? ORDER BY id DESC LIMIT ?'),
      getXp: q('SELECT * FROM guild_xp WHERE guild_id = ? AND user_id = ?'),
      upsertXp: q(`INSERT INTO guild_xp (guild_id, user_id, xp, level, messages, last_xp) VALUES (?, ?, ?, 0, 1, ?)
                   ON CONFLICT(guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp, messages = messages + 1, last_xp = excluded.last_xp`),
      setLevel: q('UPDATE guild_xp SET level = ? WHERE guild_id = ? AND user_id = ?'),
      xpTop: q('SELECT * FROM guild_xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?'),
      xpRank: q('SELECT COUNT(*) + 1 AS rank FROM guild_xp WHERE guild_id = ? AND xp > ?'),
      sessGet: q('SELECT data FROM web_sessions WHERE sid = ? AND expires > ?'),
      sessSet: q('INSERT INTO web_sessions (sid, data, expires) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires = excluded.expires'),
      sessDel: q('DELETE FROM web_sessions WHERE sid = ?'),
      sessPurge: q('DELETE FROM web_sessions WHERE expires <= ?'),
    };
    this._transfer = this.db.transaction((fromId, toId, amount, type, note) => {
      this.user(fromId);
      this.user(toId);
      const from = this.q.getUser.get(fromId);
      if (from.balance < amount) throw new Error(`Nincs elég kredited (egyenleg: ${from.balance}).`);
      this.q.addBalance.run(-amount, fromId);
      this.q.addBalance.run(amount, toId);
      this.q.insertTx.run(fromId, toId, amount, type, note ?? null, Date.now());
      return { from: this.q.getUser.get(fromId).balance, to: this.q.getUser.get(toId).balance };
    });
    this._buy = this.db.transaction((userId, itemId, qty) => {
      const item = this.q.item.get(itemId);
      if (!item) throw new Error('Nincs ilyen tárgy a boltban.');
      const total = item.price * qty;
      const u = this.user(userId);
      if (u.balance < total) throw new Error(`Nincs elég kredited: ${total} kell, ${u.balance} van.`);
      this.q.addBalance.run(-total, userId);
      this.q.addInv.run(userId, itemId, qty);
      this.q.insertTx.run(userId, null, total, 'buy', `${qty}x ${item.id}`, Date.now());
      return { item, total, balance: u.balance - total };
    });
  }

  // ---------- felhasználók / kreditek ----------
  user(id, startingBalance = 0) {
    this.q.insertUser.run(id, startingBalance, Date.now());
    return this.q.getUser.get(id);
  }
  balance(id) { return this.user(id).balance; }

  add(id, amount, type = 'admin_add', note = null) {
    assertAmount(amount);
    this.user(id);
    this.q.addBalance.run(amount, id);
    this.q.insertTx.run(null, id, amount, type, note, Date.now());
    return this.balance(id);
  }
  remove(id, amount, type = 'admin_remove', note = null) {
    assertAmount(amount);
    const u = this.user(id);
    if (u.balance < amount) throw new Error('Nincs elég kredit a számlán.');
    this.q.addBalance.run(-amount, id);
    this.q.insertTx.run(id, null, amount, type, note, Date.now());
    return this.balance(id);
  }
  transfer(fromId, toId, amount, note = null) {
    if (fromId === toId) throw new Error('Magadnak nem küldhetsz kreditet.');
    assertAmount(amount);
    return this._transfer(fromId, toId, amount, 'pay', note);
  }
  claimDaily(id, reward) {
    const u = this.user(id);
    const remaining = u.last_daily + DAY_MS - Date.now();
    if (remaining > 0) return { ok: false, remaining };
    this.q.setLastDaily.run(Date.now(), id);
    return { ok: true, balance: this.add(id, reward, 'daily') };
  }
  work(id, min, max, cooldownMs) {
    const u = this.user(id);
    const remaining = u.last_work + cooldownMs - Date.now();
    if (remaining > 0) return { ok: false, remaining };
    const earned = min + Math.floor(Math.random() * (max - min + 1));
    this.q.setLastWork.run(Date.now(), id);
    return { ok: true, earned, balance: this.add(id, earned, 'work') };
  }
  /** Fogadás: pozitív delta nyeremény, negatív veszteség. */
  bet(id, amount, delta, type) {
    assertAmount(amount);
    const u = this.user(id);
    if (u.balance < amount) throw new Error(`Nincs elég kredited (egyenleg: ${u.balance}).`);
    if (delta === 0) return u.balance;
    this.q.addBalance.run(delta, id);
    this.q.insertTx.run(delta < 0 ? id : null, delta > 0 ? id : null, Math.abs(delta), type, null, Date.now());
    return this.balance(id);
  }
  top(limit = 10) { return this.q.top.all(limit); }
  history(id, limit = 10) { return this.q.txHistory.all(id, id, limit); }
  stats() {
    return {
      users: this.q.countUsers.get().n,
      credits: this.q.totalCredits.get().n,
    };
  }

  // ---------- bolt ----------
  items() { return this.q.items.all(); }
  buy(userId, itemId, qty = 1) {
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) throw new Error('A mennyiség 1 és 100 között lehet.');
    return this._buy(userId, itemId, qty);
  }
  inventory(userId) { return this.q.inv.all(userId); }

  // ---------- szerverbeállítások ----------
  settings(guildId) {
    this.q.insertSettings.run(guildId, Date.now());
    const row = this.q.getSettings.get(guildId);
    row.badwords = safeJson(row.badwords, []);
    return row;
  }
  updateSettings(guildId, patch) {
    this.settings(guildId);
    const allowed = new Set([
      'log_channel', 'welcome_channel', 'welcome_message', 'antispam', 'antispam_limit', 'antispam_window', 'antispam_timeout',
      'antilink', 'antiinvite', 'badwords', 'antiraid', 'antiraid_joins', 'antiraid_window', 'antiraid_action', 'min_account_age',
      'xp_enabled', 'levelup_channel',
    ]);
    const keys = Object.keys(patch).filter((k) => allowed.has(k));
    if (keys.length === 0) return this.settings(guildId);
    const values = keys.map((k) => (k === 'badwords' ? JSON.stringify(patch[k]) : patch[k]));
    const sql = `UPDATE guild_settings SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE guild_id = ?`;
    this.db.prepare(sql).run(...values, Date.now(), guildId);
    return this.settings(guildId);
  }

  // ---------- moderáció ----------
  warn(guildId, userId, modId, reason) {
    const info = this.q.addWarn.run(guildId, userId, modId, reason, Date.now());
    this.logAction(guildId, userId, modId, 'warn', reason);
    return { id: info.lastInsertRowid, count: this.warnings(guildId, userId).length };
  }
  warnings(guildId, userId) { return this.q.warns.all(guildId, userId); }
  removeWarning(guildId, id) { return this.q.delWarn.run(id, guildId).changes > 0; }
  clearWarnings(guildId, userId) { return this.q.clearWarns.run(guildId, userId).changes; }
  logAction(guildId, userId, modId, action, reason) {
    this.q.addMod.run(guildId, userId ?? null, modId, action, reason ?? null, Date.now());
  }
  modActions(guildId, limit = 20) { return this.q.modLog.all(guildId, limit); }

  // ---------- XP / szintek ----------
  addXp(guildId, userId, amount, cooldownMs) {
    const row = this.q.getXp.get(guildId, userId);
    if (row && Date.now() - row.last_xp < cooldownMs) return { gained: false };
    this.q.upsertXp.run(guildId, userId, amount, Date.now());
    const after = this.q.getXp.get(guildId, userId);
    let level = after.level;
    let needed = LEVEL_XP(level);
    let total = after.xp;
    // összes XP → szint
    let acc = 0;
    level = 0;
    while (total >= acc + LEVEL_XP(level)) { acc += LEVEL_XP(level); level++; }
    needed = LEVEL_XP(level);
    const leveledUp = level > after.level;
    if (leveledUp) this.q.setLevel.run(level, guildId, userId);
    return { gained: true, leveledUp, level, xp: total, progress: total - acc, needed };
  }
  rank(guildId, userId) {
    const row = this.q.getXp.get(guildId, userId);
    if (!row) return null;
    let acc = 0, level = 0;
    while (row.xp >= acc + LEVEL_XP(level)) { acc += LEVEL_XP(level); level++; }
    return { ...row, level, progress: row.xp - acc, needed: LEVEL_XP(level), rank: this.q.xpRank.get(guildId, row.xp).rank };
  }
  xpTop(guildId, limit = 10) { return this.q.xpTop.all(guildId, limit); }

  // ---------- web sessionök ----------
  sessionGet(sid) { const r = this.q.sessGet.get(sid, Date.now()); return r ? safeJson(r.data, null) : null; }
  sessionSet(sid, data, expires) { this.q.sessSet.run(sid, JSON.stringify(data), expires); }
  sessionDel(sid) { this.q.sessDel.run(sid); }
  sessionPurge() { this.q.sessPurge.run(Date.now()); }

  close() { this.db.close(); }
}

function assertAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Az összegnek pozitív egész számnak kell lennie.');
  if (amount > 1_000_000_000) throw new Error('Túl nagy összeg.');
}
function safeJson(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }
