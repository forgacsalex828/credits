import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config, assertConfig } from './lib/config.js';
import { MeteorDB } from './lib/db.js';
import { loadCommands } from './lib/loadCommands.js';
import { startWeb } from './web/server.js';

assertConfig({ web: true });
const __dirname = dirname(fileURLToPath(import.meta.url));

// Guilds: slash parancsok, GuildMembers: anti-raid + üdvözlés, GuildMessages+MessageContent: anti-spam, szűrők, XP.
// A GuildMembers és a MessageContent PRIVILEGIZÁLT intent: a Developer Portal → Bot oldalon be kell kapcsolni!
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.GuildMember],
});

client.commands = new Collection(await loadCommands());
client.db = new MeteorDB();
console.log(`📦 ${client.commands.size} parancs betöltve, adatbázis kész.`);

const eventsDir = join(__dirname, 'events');
for (const file of readdirSync(eventsDir).filter((f) => f.endsWith('.js'))) {
  const { default: event } = await import(pathToFileURL(join(eventsDir, file)).href);
  if (event.once) client.once(event.name, (...args) => event.execute(...args));
  else client.on(event.name, (...args) => event.execute(...args));
}

process.on('unhandledRejection', (err) => console.error('Kezeletlen hiba:', err));
process.on('uncaughtException', (err) => console.error('Nem elkapott kivétel:', err));

let web = null;
if (config.web.enabled) web = startWeb(client);

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log('Leállítás...');
    web?.close();
    client.destroy();
    client.db.close();
    process.exit(0);
  });
}

client.login(config.token);
