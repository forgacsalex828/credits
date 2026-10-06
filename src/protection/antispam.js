// Anti-spam: ha egy felhasználó X üzenetet küld Y másodpercen belül, timeoutot kap,
// és a spam üzenetek törlődnek.
import { PermissionFlagsBits } from 'discord.js';
import { logModAction } from '../lib/modlog.js';

const history = new Map(); // `${guild}:${user}` → [timestamp...]

setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [k, arr] of history) {
    const kept = arr.filter((t) => t > cutoff);
    if (kept.length) history.set(k, kept); else history.delete(k);
  }
}, 30_000).unref();

/** @returns {Promise<boolean>} true, ha az üzenetet spamként kezelte */
export async function handleAntiSpam(message, settings) {
  if (!settings.antispam) return false;
  const member = message.member;
  if (!member || member.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

  const key = `${message.guildId}:${message.author.id}`;
  const now = Date.now();
  const windowMs = settings.antispam_window * 1000;
  const arr = (history.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  history.set(key, arr);
  if (arr.length < settings.antispam_limit) return false;

  history.delete(key);
  const me = message.guild.members.me;
  const canTimeout = me?.permissions.has(PermissionFlagsBits.ModerateMembers) && member.moderatable;
  const reason = `Spam: ${arr.length} üzenet ${settings.antispam_window} mp alatt`;

  if (canTimeout) await member.timeout(settings.antispam_timeout * 1000, reason).catch(() => {});

  // Spam üzenetek törlése
  if (me?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    const recent = await message.channel.messages.fetch({ limit: 50 }).catch(() => null);
    const toDelete = recent?.filter((m) => m.author.id === message.author.id && now - m.createdTimestamp < windowMs * 2);
    if (toDelete?.size) await message.channel.bulkDelete(toDelete, true).catch(() => {});
  }

  await message.channel
    .send({ content: `🛡️ ${message.author}, lassíts! Spam miatt ${canTimeout ? `${Math.round(settings.antispam_timeout / 60)} perc elhallgattatást kaptál.` : 'figyelmeztetést kaptál.'}`, allowedMentions: { users: [message.author.id] } })
    .then((m) => setTimeout(() => m.delete().catch(() => {}), 8000))
    .catch(() => {});

  await logModAction(message.client, message.guild, { action: 'antispam', target: message.author, moderator: null, reason });
  return true;
}
