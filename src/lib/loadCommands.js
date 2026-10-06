import { readdirSync, statSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, '..', 'commands');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

/** Beolvassa a src/commands mappa (és almappái) minden parancsát. A kategória = almappa neve. */
export async function loadCommands() {
  const commands = new Map();
  for (const file of walk(COMMANDS_DIR)) {
    const mod = await import(pathToFileURL(file).href);
    const command = mod.default;
    if (!command?.data || typeof command.execute !== 'function') {
      console.warn(`[FIGYELEM] ${file}: hiányzik a "data" vagy az "execute", kihagyva.`);
      continue;
    }
    command.category ??= basename(dirname(file));
    commands.set(command.data.name, command);
  }
  return commands;
}
