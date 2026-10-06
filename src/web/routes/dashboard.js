import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ChannelType } from 'discord.js';
import { requireLogin, requireGuildAccess } from '../middleware.js';
import { guildIconUrl, inviteUrl } from '../discordOAuth.js';

const writeLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false });

const clamp = (v, min, max, d) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const bool = (v) => (v === 'on' || v === '1' || v === 'true' ? 1 : 0);

export default function dashboardRoutes(client) {
  const router = Router();
  router.use(requireLogin);

  router.get('/', (req, res) => {
    const guilds = req.session.guilds.map((g) => ({ ...g, icon: guildIconUrl(g), hasBot: client.guilds.cache.has(g.id) }))
      .sort((a, b) => Number(b.hasBot) - Number(a.hasBot) || a.name.localeCompare(b.name));
    res.render('dashboard/guilds', { title: 'Vezérlőpult', guilds, invite: inviteUrl() });
  });

  const guard = requireGuildAccess(client);

  router.get('/:guildId', guard, (req, res) => {
    const settings = client.db.settings(req.guild.id);
    const channels = req.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).sort((a, b) => a.rawPosition - b.rawPosition).map((c) => ({ id: c.id, name: c.name }));
    res.render('dashboard/guild', { title: req.guild.name, guild: req.guild, settings, channels, saved: req.query.saved === '1', icon: req.guild.iconURL({ size: 64 }) });
  });

  router.post('/:guildId', writeLimiter, guard, (req, res) => {
    const b = req.body;
    const validChannel = (id) => (id && req.guild.channels.cache.has(id) ? id : null);
    const badwords = String(b.badwords ?? '').split(/[\n,]/).map((w) => w.trim().toLowerCase()).filter((w) => w && w.length <= 50).slice(0, 200);
    client.db.updateSettings(req.guild.id, {
      log_channel: validChannel(b.log_channel),
      welcome_channel: validChannel(b.welcome_channel),
      welcome_message: String(b.welcome_message ?? '').slice(0, 500) || null,
      levelup_channel: validChannel(b.levelup_channel),
      xp_enabled: bool(b.xp_enabled),
      antispam: bool(b.antispam),
      antispam_limit: clamp(b.antispam_limit, 3, 20, 6),
      antispam_window: clamp(b.antispam_window, 2, 30, 5),
      antispam_timeout: clamp(b.antispam_timeout, 60, 86400, 300),
      antiinvite: bool(b.antiinvite),
      antilink: bool(b.antilink),
      badwords: [...new Set(badwords)],
      antiraid: bool(b.antiraid),
      antiraid_joins: clamp(b.antiraid_joins, 3, 50, 8),
      antiraid_window: clamp(b.antiraid_window, 5, 120, 10),
      antiraid_action: ['kick', 'ban', 'none'].includes(b.antiraid_action) ? b.antiraid_action : 'kick',
      min_account_age: clamp(b.min_account_age, 0, 365, 0),
    });
    client.db.logAction(req.guild.id, null, req.session.user.id, 'settings', 'Beállítások módosítva a weboldalon');
    res.redirect(`/dashboard/${req.guild.id}?saved=1`);
  });

  router.get('/:guildId/modlog', guard, (req, res) => {
    const rows = client.db.modActions(req.guild.id, 100);
    res.render('dashboard/modlog', { title: `${req.guild.name} – napló`, guild: req.guild, rows });
  });

  router.get('/:guildId/levels', guard, (req, res) => {
    const rows = client.db.xpTop(req.guild.id, 50);
    res.render('dashboard/levels', { title: `${req.guild.name} – szintek`, guild: req.guild, rows });
  });

  return router;
}
