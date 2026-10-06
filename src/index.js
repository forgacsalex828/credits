import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config, assertConfig } from './lib/config.js';
assertConfig();
import { CreditStore } from './lib/db.js';
import { loadCommands } from './lib/loadCommands.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Csak a Guilds intent kell: a slash parancsok privilegizált intent nélkül is működnek minden szerveren.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection(await loadCommands());
client.store = new CreditStore(undefined, { startingBalance: config.startingBalance });

const eventsDir = join(__dirname, 'events');
for (const file of readdirSync(eventsDir).filter((f) => f.endsWith('.js'))) {
  const { default: event } = await import(pathToFileURL(join(eventsDir, file)).href);
  if (event.once) client.once(event.name, (...args) => event.execute(...args));
  else client.on(event.name, (...args) => event.execute(...args));
}

process.on('unhandledRejection', (err) => console.error('Kezeletlen hiba:', err));
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log('Leállítás...');
    client.store.save();
    client.destroy();
    process.exit(0);
  });
}

client.login(config.token);
