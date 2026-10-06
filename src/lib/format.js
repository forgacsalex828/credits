export function formatDuration(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (d) parts.push(`${d} nap`);
  if (h) parts.push(`${h} óra`);
  if (m) parts.push(`${m} perc`);
  if (s && !d) parts.push(`${s} mp`);
  if (parts.length === 0) parts.push('0 mp');
  return parts.join(' ');
}

export function credits(n) {
  return `${Number(n).toLocaleString('hu-HU')} kredit`;
}

/** "10m", "2h", "1d", "30s" → ms. Hibás formátum esetén null. */
export function parseDuration(str) {
  const m = /^(\d+)\s*(s|mp|m|p|h|ó|d|n)$/i.exec(String(str).trim());
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = { s: 1e3, mp: 1e3, m: 6e4, p: 6e4, h: 36e5, 'ó': 36e5, d: 864e5, n: 864e5 }[unit];
  return n * mult;
}

export function progressBar(value, max, size = 12) {
  const filled = Math.round((Math.min(value, max) / max) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}
