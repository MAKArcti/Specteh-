export function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('uk-UA');
}

export function formatElapsed(startedAtIso: string, nowMs: number): string {
  const startMs = new Date(startedAtIso).getTime();
  const totalMinutes = Math.max(0, Math.floor((nowMs - startMs) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function minutesBetween(startedAtIso: string, endedAtIso: string): number {
  const start = new Date(startedAtIso).getTime();
  const end = new Date(endedAtIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}
