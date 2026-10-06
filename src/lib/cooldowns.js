// Parancs-cooldown (a bot saját védelme a parancs-spam ellen).
const buckets = new Map();

/** Visszaadja a hátralévő ms-t, vagy 0-t, ha a parancs futhat. */
export function checkCooldown(userId, commandName, seconds) {
  if (!seconds) return 0;
  const key = `${userId}:${commandName}`;
  const now = Date.now();
  const until = buckets.get(key) ?? 0;
  if (until > now) return until - now;
  buckets.set(key, now + seconds * 1000);
  return 0;
}

// Takarítás, hogy a Map ne nőjön a végtelenségig.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v <= now) buckets.delete(k);
}, 60_000).unref();
