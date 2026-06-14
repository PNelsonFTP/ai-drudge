// Date extraction with 9 patterns, mirroring the patterns from the
// original site's Task 4 work log. All return ISO 8601 strings or null.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

function toIso(d: Date): string {
  return d.toISOString();
}

// Pattern 1 & 2: "<X> ago" / "Published <X> ago" / "Updated <X> ago"
function parseTimeAgo(raw: string, now: Date): string | null {
  const m = raw.toLowerCase().match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const d = new Date(now);
  switch (unit) {
    case "second": d.setSeconds(d.getSeconds() - n); break;
    case "minute": d.setMinutes(d.getMinutes() - n); break;
    case "hour":   d.setHours(d.getHours() - n); break;
    case "day":    d.setDate(d.getDate() - n); break;
    case "week":   d.setDate(d.getDate() - n * 7); break;
    case "month":  d.setMonth(d.getMonth() - n); break;
    case "year":   d.setFullYear(d.getFullYear() - n); break;
    default: return null;
  }
  return toIso(d);
}

// Pattern 3: "Last week" / "Last month"
function parseLast(raw: string, now: Date): string | null {
  const m = raw.toLowerCase().match(/last\s+(week|month|year)/);
  if (!m) return null;
  const d = new Date(now);
  if (m[1] === "week")  d.setDate(d.getDate() - 7);
  if (m[1] === "month") d.setMonth(d.getMonth() - 1);
  if (m[1] === "year")  d.setFullYear(d.getFullYear() - 1);
  return toIso(d);
}

// Pattern 4: RFC822 — "Sat, 13 Jun 2026 18:53:03 +0530"
function parseRfc822(raw: string): string | null {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : toIso(d);
}

// Pattern 5: ISO 8601 native
function parseIso(raw: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : toIso(d);
}

// Pattern 6: Day-first — "12 Jun 2025" or "12 June 2025"
function parseDayFirst(raw: string): string | null {
  const m = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (!month) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return isNaN(d.getTime()) ? null : toIso(d);
}

// Pattern 7: Compact URL date — /20250614
function parseCompactDate(raw: string): string | null {
  const m = raw.match(/\/(\d{4})(\d{2})(\d{2})\b/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return isNaN(dt.getTime()) ? null : toIso(dt);
}

// Pattern 8: Month + day without year (assume current year)
function parseMonthDayNoYear(raw: string, now: Date): string | null {
  const m = raw.match(/\b([A-Za-z]+)\s+(\d{1,2})\b(?:\s*,)?(?!\s*\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const day = parseInt(m[2], 10);
  if (!month) return null;
  const d = new Date(Date.UTC(now.getUTCFullYear(), month - 1, day));
  // If that date is in the future, assume last year.
  if (d.getTime() > now.getTime() + 86400000) {
    d.setUTCFullYear(d.getUTCFullYear() - 1);
  }
  return isNaN(d.getTime()) ? null : toIso(d);
}

// Pattern 9: Slash dates — MM/DD/YYYY or YYYY/MM/DD
function parseSlashDate(raw: string): string | null {
  let m = raw.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d.getTime()) ? null : toIso(d);
  }
  m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[1] - 1, +m[2]));
    return isNaN(d.getTime()) ? null : toIso(d);
  }
  return null;
}

export function extractDate(raw: string | null | undefined, now: Date = new Date()): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  return (
    parseTimeAgo(s, now) ||
    parseLast(s, now) ||
    parseIso(s) ||
    parseRfc822(s) ||
    parseDayFirst(s) ||
    parseSlashDate(s) ||
    parseCompactDate(s) ||
    parseMonthDayNoYear(s, now)
  );
}

// Relative display: "2h ago", "just now", "3d ago", "Mar 14"
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
  // Past a week, show the date.
  const d = new Date(iso);
  const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()];
  return `${month} ${d.getUTCDate()}`;
}
