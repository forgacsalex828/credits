// Slash parancsok regisztrálása. GUILD_ID nélkül GLOBÁLISAN (minden szerverre),
// GUILD_ID-vel csak az adott tesztszerverre (azonnal látszik).
import { REST, Routes } from 'discord.js';
import { config, assertConfig } from './lib/config.js';
assertConfig();
import { loadCommands } from './lib/loadCommands.js';

const commands = [...(await loadCommands()).values()].map((c) => c.data.toJSON());
const rest = new REST().setToken(config.token);

const route = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);

console.log(`${commands.length} parancs regisztrálása ${config.guildId ? `a ${config.guildId} szerverre` : 'GLOBÁLISAN'}...`);
const data = await rest.put(route, { body: commands });
console.log(`✅ Kész: ${data.length} parancs feltöltve.`);
if (!config.guildId) console.log('ℹ️  A globális parancsok akár 1 órán belül jelennek meg minden szerveren.');
