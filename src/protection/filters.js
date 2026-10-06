// Tartalomszűrők: Discord meghívók, linkek, tiltott szavak.
import { PermissionFlagsBits } from 'discord.js';
import { logModAction } from '../lib/modlog.js';

const INVITE_RE = /(discord\.gg|discord(?:app)?\.com\/invite|dsc\.gg)\/[\w-]+/i;
const LINK_RE = /https?:\/\/\S+|www\.\S+\.\S+/i;

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '');
}

/** @returns {Promise<boolean>} true, ha az üzenetet törölte */
export async function handleFilters(message, settings) {
  const member = message.member;
  if (!member || member.permissions.has(PermissionFlagsBits.ManageMessages)) return false;
  const content = message.content ?? '';

  let violation = null;
  if (settings.antiinvite && INVITE_RE.test(content)) violation = 'Discord meghívó link';
  else if (settings.antilink && LINK_RE.test(content)) violation = 'Link küldése tiltott';
  else if (settings.badwords.length) {
    const norm = ` ${normalize(content)} `;
    const hit = settings.badwords.find((w) => w && norm.includes(` ${normalize(w)} `));
    if (hit) violation = `Tiltott szó: "${hit}"`;
  }
  if (!violation) return false;

  const me = message.guild.members.me;
  if (me?.permissions.has(PermissionFlagsBits.ManageMessages)) await message.delete().catch(() => {});
  await message.channel
    .send({ content: `🚫 ${message.author}, ezt itt nem lehet: ${violation}.`, allowedMentions: { users: [message.author.id] } })
    .then((m) => setTimeout(() => m.delete().catch(() => {}), 6000))
    .catch(() => {});
  await logModAction(message.client, message.guild, {
    action: 'filter', target: message.author, moderator: null, reason: violation, extra: content.slice(0, 300),
  });
  return true;
}
