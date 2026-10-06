import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN ?? '',
  clientId: process.env.CLIENT_ID ?? '',
  guildId: process.env.GUILD_ID || null,
  dailyReward: Number(process.env.DAILY_REWARD ?? 100),
  startingBalance: Number(process.env.STARTING_BALANCE ?? 0),
};

/** Ellenőrzi a kötelező beállításokat; hiány esetén érthető hibával kilép. */
export function assertConfig() {
  const missing = [];
  if (!config.token) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('CLIENT_ID');
  if (missing.length) {
    console.error(`Hiányzó környezeti változó: ${missing.join(', ')}. Másold le a .env.example fájlt .env névre, és töltsd ki.`);
    process.exit(1);
  }
}
