import { Router } from 'express';
import { inviteUrl } from '../discordOAuth.js';
import { config } from '../../lib/config.js';

const router = Router();
const nameCache = new Map(); // userId → { name, avatar, t }

async function resolveUsers(client, ids) {
  const out = new Map();
  await Promise.all(ids.map(async (id) => {
    const cached = nameCache.get(id);
    if (cached && Date.now() - cached.t < 3_600_000) { out.set(id, cached); return; }
    const u = await client.users.fetch(id).catch(() => null);
    const entry = { name: u?.globalName ?? u?.username ?? `Ismeretlen (${id.slice(-4)})`, avatar: u?.displayAvatarURL({ size: 64, extension: 'png' }) ?? null, t: Date.now() };
    nameCache.set(id, entry);
    out.set(id, entry);
  }));
  return out;
}

export default function publicRoutes(client) {
  router.get('/', (req, res) => {
    const s = client.db.stats();
    res.render('index', {
      title: 'Meteor bot',
      stats: { ...s, guilds: client.guilds.cache.size, members: client.guilds.cache.reduce((a, g) => a + (g.memberCount ?? 0), 0) },
      invite: inviteUrl(),
    });
  });

  router.get('/leaderboard', async (req, res) => {
    const top = client.db.top(50);
    const users = await resolveUsers(client, top.map((u) => u.id));
    res.render('leaderboard', { title: 'Toplista', top, users });
  });

  router.get('/commands', (req, res) => {
    const groups = {};
    for (const c of client.commands.values()) (groups[c.category] ??= []).push(c.data.toJSON());
    for (const k of Object.keys(groups)) groups[k].sort((a, b) => a.name.localeCompare(b.name));
    res.render('commands', { title: 'Parancsok', groups });
  });

  router.get('/invite', (req, res) => res.redirect(inviteUrl()));

  router.get('/api/stats', (req, res) => {
    const s = client.db.stats();
    res.json({ bot: client.user?.tag ?? null, guilds: client.guilds.cache.size, users: s.users, credits: s.credits, uptime: Math.floor(process.uptime()), ping: client.ws.ping });
  });

  router.get('/api/leaderboard', (req, res) => res.json(client.db.top(Math.min(Number(req.query.limit) || 25, 100))));

  router.get('/health', (req, res) => res.json({ ok: client.isReady(), ws: client.ws.status, web: config.web.baseUrl }));
  return router;
}
