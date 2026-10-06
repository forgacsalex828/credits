import { EmbedBuilder } from 'discord.js';
import { BOT_COLOR } from './branding.js';

const ACTION_COLORS = {
  ban: 0xe74c3c, kick: 0xe67e22, timeout: 0xf39c12, warn: 0xf1c40f, unban: 0x2ecc71,
  purge: 0x3498db, lock: 0x95a5a6, unlock: 0x2ecc71, antispam: 0x9b59b6, antiraid: 0xc0392b,
  filter: 0x8e44ad, untimeout: 0x2ecc71, warn_remove: 0x2ecc71,
};

/** Bejegyzés az adatbázisba + üzenet a szerver log csatornájába (ha be van állítva). */
export async function logModAction(client, guild, { action, target, moderator, reason, extra }) {
  const db = client.db;
  db.logAction(guild.id, target?.id ?? null, moderator?.id ?? client.user.id, action, reason ?? null);
  const settings = db.settings(guild.id);
  if (!settings.log_channel) return;
  const channel = guild.channels.cache.get(settings.log_channel) ?? (await guild.channels.fetch(settings.log_channel).catch(() => null));
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder()
    .setColor(ACTION_COLORS[action] ?? BOT_COLOR)
    .setTitle(`🛡️ ${action.toUpperCase()}`)
    .setTimestamp()
    .addFields(
      { name: 'Moderátor', value: moderator ? `${moderator} (${moderator.tag ?? moderator.username})` : 'Meteor bot (automatikus)', inline: true },
    );
  if (target) embed.addFields({ name: 'Érintett', value: `${target} (\`${target.id}\`)`, inline: true });
  if (reason) embed.addFields({ name: 'Indok', value: reason.slice(0, 1000) });
  if (extra) embed.addFields({ name: 'Részletek', value: String(extra).slice(0, 1000) });
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => {});
}
