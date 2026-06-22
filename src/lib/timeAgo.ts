// Client-side time-ago display. The build-time extraction already produced
// ISO 8601 strings; this just formats them relative to now.

export function timeAgoDisplay(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Math.max(0, now.getTime() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60)    return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60)    return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)     return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7)     return `${day}d ago`;
  const d = new Date(iso);
  const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()];
  return `${month} ${d.getUTCDate()}`;
}

export function ageHours(iso: string | null, now: Date = new Date()): number {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return Infinity;
  return Math.max(0, (now.getTime() - then) / 3_600_000);
}

// #12: "NEW" badge for items posted within the threshold.
export function isNew(iso: string | null, withinHours = 6, now: Date = new Date()): boolean {
  return ageHours(iso, now) <= withinHours;
}

// #12: subtle de-emphasis for items older than the threshold.
export function isStale(iso: string | null, afterHours = 72, now: Date = new Date()): boolean {
  if (!iso) return false;
  return ageHours(iso, now) > afterHours;
}
