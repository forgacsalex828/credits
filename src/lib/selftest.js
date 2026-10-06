// Gyors önellenőrzés: token nélkül is lefut (npm run check).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { CreditStore } from './db.js';
import { loadCommands } from './loadCommands.js';

const dir = mkdtempSync(join(tmpdir(), 'credits-test-'));
try {
  const store = new CreditStore(join(dir, 'db.json'), { startingBalance: 5 });
  assert.equal(store.balance('a'), 5);
  store.add('a', 10);
  assert.equal(store.balance('a'), 15);
  assert.throws(() => store.transfer('a', 'b', 100));
  store.transfer('a', 'b', 7);
  assert.equal(store.balance('a'), 8);
  assert.equal(store.balance('b'), 12);
  assert.throws(() => store.remove('a', 0));
  const d1 = store.claimDaily('a', 100);
  assert.equal(d1.ok, true);
  const d2 = store.claimDaily('a', 100);
  assert.equal(d2.ok, false);
  assert.ok(d2.remaining > 0);
  assert.deepEqual(store.top(1)[0], { id: 'a', balance: 108 });

  // Újratöltés fájlból
  const reloaded = new CreditStore(join(dir, 'db.json'));
  assert.equal(reloaded.balance('b'), 12);

  const commands = await loadCommands();
  assert.ok(commands.size >= 1, 'legalább egy parancs kell');
  for (const [name, cmd] of commands) {
    const json = cmd.data.toJSON();
    assert.equal(json.name, name);
  }
  console.log(`Önellenőrzés OK — ${commands.size} parancs betöltve: ${[...commands.keys()].join(', ')}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
