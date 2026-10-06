// Anti-raid: ha túl sokan csatlakoznak rövid időn belül, a bot kirúgja/kitiltja az új belépőket
// a riadó ideje alatt. Emellett a túl friss fiókokat (min_account_age nap) is kiszűri.
import { PermissionFlagsBits } from 'discord.js';
import { logModAction } from '../lib/modlog.js';

const joins = new Map(); // guildId → [timestamp...]
const alerts = new Map(); // guildId → riadó vége (timestamp)
const ALERT_MS = 2 * 60 * 1000;

export function isUnderRaid(guildId) {
  return (alerts.get(guildId) ?? 0) > Date.now();
}

export async function handleJoin(member, settings) {
  const guild = member.guild;
  const me = guild.members.me;
  const now = Date.now();

  // 1) Fiók-kor ellenőrzés
  if (settings.min_account_age > 0) {
    const ageDays = (now - member.user.createdTimestamp) / 86_400_000;
    if (ageDays < settings.min_account_age && member.kickable && me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      const reason = `Túl friss fiók (${ageDays.toFixed(1)} nap < ${settings.min_account_age} nap)`;
      await member.send(`A **${guild.name}** szerverre csak legalább ${settings.min_account_age} napos fiókkal lehet belépni.`).catch(() => {});
      await member.kick(reason).catch(() => {});
      await logModAction(member.client, guild, { action: 'antiraid', target: member.user, moderator: null, reason });
      return true;
    }
  }

  if (!settings.antiraid) return false;

  // 2) Belépési ráta
  const windowMs = settings.antiraid_window * 1000;
  const arr = (joins.get(guild.id) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  joins.set(guild.id, arr);

  const alreadyAlert = isUnderRaid(guild.id);
  if (arr.length >= settings.antiraid_joins && !alreadyAlert) {
    alerts.set(guild.id, now + ALERT_MS);
    await logModAction(member.client, guild, {
      action: 'antiraid', target: null, moderator: null,
      reason: `Raid gyanú: ${arr.length} belépés ${settings.antiraid_window} mp alatt. Riadó ${ALERT_MS / 60000} percig, új belépők: ${settings.antiraid_action}.`,
    });
  }

  if (!isUnderRaid(guild.id)) return false;

  const reason = 'Anti-raid: tömeges belépés észlelve';
  const action = settings.antiraid_action;
  if (action === 'ban' && member.bannable && me?.permissions.has(PermissionFlagsBits.BanMembers)) {
    await member.ban({ reason, deleteMessageSeconds: 3600 }).catch(() => {});
  } else if (action !== 'none' && member.kickable && me?.permissions.has(PermissionFlagsBits.KickMembers)) {
    await member.send(`A **${guild.name}** szerver épp raid elleni védelem alatt áll, kérlek próbálj újra néhány perc múlva.`).catch(() => {});
    await member.kick(reason).catch(() => {});
  } else {
    return false;
  }
  await logModAction(member.client, guild, { action: 'antiraid', target: member.user, moderator: null, reason: `${reason} (${action})` });
  return true;
}
