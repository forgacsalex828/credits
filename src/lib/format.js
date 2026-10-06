export function formatDuration(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (h) parts.push(`${h} óra`);
  if (m) parts.push(`${m} perc`);
  if (s || parts.length === 0) parts.push(`${s} mp`);
  return parts.join(' ');
}

export function credits(n) {
  return `${n.toLocaleString('hu-HU')} kredit`;
}
