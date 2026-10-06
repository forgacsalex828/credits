import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, '..', 'commands');

/** Beolvassa a src/commands mappa minden parancsát. */
export async function loadCommands() {
  const commands = new Map();
  for (const file of readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(join(COMMANDS_DIR, file)).href);
    const command = mod.default;
    if (!command?.data || typeof command.execute !== 'function') {
      console.warn(`[FIGYELEM] ${file}: hiányzik a "data" vagy az "execute", kihagyva.`);
      continue;
    }
    commands.set(command.data.name, command);
  }
  return commands;
}
