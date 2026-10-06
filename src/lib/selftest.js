// Önellenőrzés token nélkül: adatbázis, parancsok, védelmi segédfunkciók és a weboldal (ál-kliens).
process.env.SESSION_SECRET ??= 'selftest-secret-at-least-16-chars';
process.env.CLIENT_ID ??= '000000000000000000';
process.env.CLIENT_SECRET ??= 'selftest';
process.env.PORT ??= '0';

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { Collection } from 'discord.js';
import { MeteorDB, LEVEL_XP } from './db.js';
import { loadCommands } from './loadCommands.js';
import { parseDuration, formatDuration } from './format.js';
import { checkCooldown } from './cooldowns.js';

const dir = mkdtempSync(join(tmpdir(), 'meteor-test-'));
let failures = 0;
const step = (name, fn) => { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n    ${e.message}`); } };

console.log('Adatbázis');
const db = new MeteorDB(join(dir, 'test.sqlite'));
step('kreditek: add / transfer / remove', () => {
  db.user('a', 5);
  assert.equal(db.balance('a'), 5);
  db.add('a', 10);
  assert.equal(db.balance('a'), 15);
  assert.throws(() => db.transfer('a', 'b', 100));
  db.transfer('a', 'b', 7, 'teszt');
  assert.equal(db.balance('a'), 8);
  assert.equal(db.balance('b'), 7);
  assert.throws(() => db.remove('a', 0));
  assert.throws(() => db.transfer('a', 'a', 1));
  assert.equal(db.history('a').length, 2);
});
step('napi jutalom és munka', () => {
  assert.equal(db.claimDaily('a', 100).ok, true);
  const d2 = db.claimDaily('a', 100);
  assert.equal(d2.ok, false);
  assert.ok(d2.remaining > 0);
  const w = db.work('a', 10, 20, 60_000);
  assert.ok(w.ok && w.earned >= 10 && w.earned <= 20);
  assert.equal(db.work('a', 10, 20, 60_000).ok, false);
});
step('fogadás', () => {
  const before = db.balance('a');
  db.bet('a', 5, 5, 'coinflip');
  assert.equal(db.balance('a'), before + 5);
  db.bet('a', 5, -5, 'coinflip');
  assert.equal(db.balance('a'), before);
  assert.throws(() => db.bet('a', 10 ** 9, 1, 'slots'));
});
step('bolt és inventory', () => {
  assert.ok(db.items().length >= 5);
  db.add('shopper', 1000);
  const r = db.buy('shopper', 'coffee', 2);
  assert.equal(r.total, 100);
  assert.equal(db.balance('shopper'), 900);
  assert.equal(db.inventory('shopper')[0].qty, 2);
  assert.throws(() => db.buy('shopper', 'planet'));
  assert.throws(() => db.buy('shopper', 'nope'));
});
step('toplista és statisztika', () => {
  assert.equal(db.top(1)[0].id, 'shopper');
  assert.ok(db.stats().users >= 3);
});
step('szerverbeállítások', () => {
  const s = db.settings('g1');
  assert.equal(s.antispam, 1);
  assert.deepEqual(s.badwords, []);
  const u = db.updateSettings('g1', { badwords: ['alma', 'körte'], antispam_limit: 9, nem_letezik: 1 });
  assert.deepEqual(u.badwords, ['alma', 'körte']);
  assert.equal(u.antispam_limit, 9);
  assert.equal(u.nem_letezik, undefined);
});
step('figyelmeztetések és modlog', () => {
  const w1 = db.warn('g1', 'u1', 'mod', 'spam');
  assert.equal(w1.count, 1);
  db.warn('g1', 'u1', 'mod', 'megint');
  assert.equal(db.warnings('g1', 'u1').length, 2);
  assert.equal(db.removeWarning('g1', w1.id), true);
  assert.equal(db.removeWarning('g2', 999), false);
  assert.equal(db.clearWarnings('g1', 'u1'), 1);
  assert.ok(db.modActions('g1').length >= 2);
});
step('XP és szintek', () => {
  const r1 = db.addXp('g1', 'u1', 20, 60_000);
  assert.equal(r1.gained, true);
  assert.equal(db.addXp('g1', 'u1', 20, 60_000).gained, false);
  const r2 = db.addXp('g1', 'u1', LEVEL_XP(0), 0);
  assert.equal(r2.leveledUp, true);
  assert.equal(r2.level, 1);
  const rank = db.rank('g1', 'u1');
  assert.equal(rank.rank, 1);
  assert.equal(rank.level, 1);
  assert.equal(db.xpTop('g1')[0].user_id, 'u1');
});
step('web session tároló', () => {
  db.sessionSet('sid1', { user: { id: '1' } }, Date.now() + 10_000);
  assert.equal(db.sessionGet('sid1').user.id, '1');
  db.sessionSet('old', { x: 1 }, Date.now() - 1);
  assert.equal(db.sessionGet('old'), null);
  db.sessionPurge();
  db.sessionDel('sid1');
  assert.equal(db.sessionGet('sid1'), null);
});
step('újranyitás fájlból', () => {
  db.close();
  const re = new MeteorDB(join(dir, 'test.sqlite'));
  assert.equal(re.balance('b'), 7);
  re.close();
});

console.log('Segédfunkciók');
step('parseDuration / formatDuration', () => {
  assert.equal(parseDuration('10m'), 600_000);
  assert.equal(parseDuration('2h'), 7_200_000);
  assert.equal(parseDuration('1d'), 86_400_000);
  assert.equal(parseDuration('abc'), null);
  assert.equal(formatDuration(90_000), '1 perc 30 mp');
});
step('cooldown', () => {
  assert.equal(checkCooldown('u', 'cmd', 5), 0);
  assert.ok(checkCooldown('u', 'cmd', 5) > 0);
  assert.equal(checkCooldown('u', 'cmd', 0), 0);
});

console.log('Parancsok');
const commands = await loadCommands();
step(`${commands.size} parancs betöltve és szerializálható`, () => {
  assert.ok(commands.size >= 20);
  for (const [name, cmd] of commands) {
    const json = cmd.data.toJSON();
    assert.equal(json.name, name);
    assert.ok(cmd.category);
  }
});

console.log('Weboldal');
const webDb = new MeteorDB(join(dir, 'web.sqlite'));
webDb.add('111111111111111111', 500);
const fakeClient = {
  db: webDb,
  commands: new Collection(commands),
  user: { tag: 'Meteor#0000' },
  ws: { ping: 42, status: 0 },
  isReady: () => true,
  guilds: { cache: new Collection() },
  users: { fetch: async () => null },
};
const { startWeb } = await import('../web/server.js');
const server = startWeb(fakeClient);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
const get = (p, opts) => fetch(base + p, { redirect: 'manual', ...opts });
await (async () => {
  const check = async (name, fn) => { try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n    ${e.message}`); } };
  await check('GET / 200 + biztonsági fejlécek', async () => {
    const r = await get('/');
    assert.equal(r.status, 200);
    assert.ok(r.headers.get('content-security-policy')?.includes("default-src 'self'"));
    assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(r.headers.get('x-powered-by'), null);
    assert.ok((await r.text()).includes('Meteor bot'));
  });
  await check('GET /leaderboard, /commands 200', async () => {
    for (const p of ['/leaderboard', '/commands']) assert.equal((await get(p)).status, 200, p);
  });
  await check('GET /api/stats JSON', async () => {
    const j = await (await get('/api/stats')).json();
    assert.equal(j.users, 1);
    assert.equal(j.ping, 42);
  });
  await check('GET /dashboard → /login átirányítás', async () => {
    const r = await get('/dashboard');
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('location'), '/login');
  });
  await check('GET /login → Discord OAuth', async () => {
    const r = await get('/login');
    assert.equal(r.status, 302);
    assert.ok(r.headers.get('location').startsWith('https://discord.com/oauth2/authorize'));
  });
  await check('GET /callback rossz state → 400', async () => {
    assert.equal((await get('/callback?code=x&state=y')).status, 400);
  });
  await check('POST CSRF token nélkül → 403', async () => {
    const r = await get('/logout', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: '' });
    assert.equal(r.status, 403);
  });
  await check('404 oldal', async () => {
    assert.equal((await get('/nincs-ilyen')).status, 404);
  });
})();
server.close();
webDb.close();
rmSync(dir, { recursive: true, force: true });

if (failures) { console.error(`\n${failures} ellenőrzés sikertelen.`); process.exit(1); }
console.log(`\nÖnellenőrzés OK — ${commands.size} parancs: ${[...commands.keys()].sort().join(', ')}`);
process.exit(0);
