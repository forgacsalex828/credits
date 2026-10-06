import { Events } from 'discord.js';
import { handleAntiSpam } from '../protection/antispam.js';
import { handleFilters } from '../protection/filters.js';
import { config } from '../lib/config.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.inGuild() || message.author.bot || message.system) return;
    const db = message.client.db;
    const settings = db.settings(message.guildId);

    // Védelmek (sorrend: spam → szűrők)
    if (await handleAntiSpam(message, settings)) return;
    if (await handleFilters(message, settings)) return;

    // XP
    if (!settings.xp_enabled) return;
    const gained = config.xpMin + Math.floor(Math.random() * (config.xpMax - config.xpMin + 1));
    const r = db.addXp(message.guildId, message.author.id, gained, config.xpCooldownSec * 1000);
    if (r.gained && r.leveledUp) {
      const target = (settings.levelup_channel && message.guild.channels.cache.get(settings.levelup_channel)) || message.channel;
      await target.send({ content: `🎉 ${message.author} elérte a **${r.level}. szintet**!`, allowedMentions: { users: [message.author.id] } }).catch(() => {});
    }
  },
};
