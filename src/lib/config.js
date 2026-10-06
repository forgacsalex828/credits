import 'dotenv/config';

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

export const config = {
  token: process.env.DISCORD_TOKEN ?? '',
  clientId: process.env.CLIENT_ID ?? '',
  clientSecret: process.env.CLIENT_SECRET ?? '',
  guildId: process.env.GUILD_ID || null,
  ownerIds: (process.env.OWNER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean),

  dailyReward: num(process.env.DAILY_REWARD, 100),
  startingBalance: num(process.env.STARTING_BALANCE, 0),
  workMin: num(process.env.WORK_MIN, 20),
  workMax: num(process.env.WORK_MAX, 80),
  workCooldownMin: num(process.env.WORK_COOLDOWN_MIN, 30),
  maxBet: num(process.env.MAX_BET, 5000),

  xpMin: 15,
  xpMax: 25,
  xpCooldownSec: 60,

  web: {
    enabled: (process.env.WEB_ENABLED ?? 'true') !== 'false',
    port: num(process.env.PORT, 3000),
    baseUrl: (process.env.BASE_URL ?? `http://localhost:${num(process.env.PORT, 3000)}`).replace(/\/$/, ''),
    sessionSecret: process.env.SESSION_SECRET ?? '',
    trustProxy: (process.env.TRUST_PROXY ?? 'false') === 'true',
  },
};

/** Ellenőrzi a kötelező beállításokat; hiány esetén érthető hibával kilép. */
export function assertConfig({ web = false } = {}) {
  const missing = [];
  if (!config.token) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('CLIENT_ID');
  if (web && config.web.enabled) {
    if (!config.clientSecret) missing.push('CLIENT_SECRET (a weboldal Discord-bejelentkezéséhez)');
    if (!config.web.sessionSecret || config.web.sessionSecret.length < 16) missing.push('SESSION_SECRET (legalább 16 karakter)');
  }
  if (missing.length) {
    console.error(`Hiányzó környezeti változó: ${missing.join(', ')}. Másold le a .env.example fájlt .env névre, és töltsd ki.`);
    process.exit(1);
  }
}
