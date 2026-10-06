import { config } from '../lib/config.js';

const API = 'https://discord.com/api/v10';
export const SCOPES = ['identify', 'guilds'];
export const MANAGE_GUILD = 0x20n;
export const ADMINISTRATOR = 0x8n;

export function authorizeUrl(state) {
  const p = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${config.web.baseUrl}/callback`,
    response_type: 'code',
    scope: SCOPES.join(' '),
    state,
    prompt: 'none',
  });
  return `https://discord.com/oauth2/authorize?${p}`;
}

export function inviteUrl() {
  // Jogok: Kick, Ban, Manage Channels, Manage Messages, Moderate Members, Send Messages, Embed Links, Read History
  const permissions = (1n << 1n) | (1n << 2n) | (1n << 4n) | (1n << 13n) | (1n << 40n) | (1n << 11n) | (1n << 14n) | (1n << 16n) | (1n << 10n);
  return `https://discord.com/oauth2/authorize?client_id=${config.clientId}&scope=bot%20applications.commands&permissions=${permissions}`;
}

export async function exchangeCode(code) {
  const res = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${config.web.baseUrl}/callback`,
    }),
  });
  if (!res.ok) throw new Error(`Token csere sikertelen (${res.status})`);
  return res.json();
}

async function api(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Discord API hiba ${res.status} (${path})`);
  return res.json();
}

export async function fetchProfile(token) {
  const [user, guilds] = await Promise.all([api('/users/@me', token), api('/users/@me/guilds', token)]);
  const manageable = guilds
    .filter((g) => g.owner || (BigInt(g.permissions) & (MANAGE_GUILD | ADMINISTRATOR)) !== 0n)
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
  return {
    user: { id: user.id, username: user.username, global_name: user.global_name, avatar: user.avatar },
    guilds: manageable,
  };
}

export function avatarUrl(user, size = 64) {
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) >> 22n) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=${size}`;
}
export function guildIconUrl(g, size = 64) {
  return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=${size}` : null;
}
