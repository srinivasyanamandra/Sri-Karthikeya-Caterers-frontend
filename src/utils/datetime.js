/**
 * Datetime utilities — centralised so every admin schedule input goes
 * through a single, timezone-safe path.
 *
 * Background: the campaign scheduler bug we hit in production was caused
 * by sending naive datetime strings (`2026-05-08T15:30:00`) without a
 * timezone suffix. Spring Boot's Jackson deserialiser refused to parse
 * them as Instant on some runs and silently parsed them as UTC on
 * others, leaving campaigns either rejected or fired hours late. These
 * helpers eliminate the class of bug at the boundary.
 */

/** IANA timezone for the business; used for display + reasoning, not for
 *  serialisation (the wire format is always UTC ISO-8601). */
export const BUSINESS_TZ = 'Asia/Kolkata';

/** Resolve the browser's current IANA timezone, falling back to the
 *  business default on environments without Intl. */
export const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || BUSINESS_TZ;
  } catch {
    return BUSINESS_TZ;
  }
};

/**
 * Combine a `<input type="date">` value (`yyyy-mm-dd`) and a
 * `<input type="time">` value (`HH:mm`) interpreted in the browser's
 * local timezone, and return a UTC ISO-8601 string the backend's
 * `Instant` deserialiser will accept (`2026-05-08T10:00:00.000Z`).
 *
 * Returns `null` if either input is missing or unparseable.
 */
export const localDateTimeToUtcIso = (date, time) => {
  if (!date || !time) return null;
  const composed = new Date(`${date}T${time}`);
  if (Number.isNaN(composed.getTime())) return null;
  return composed.toISOString();
};

/** Inverse of `localDateTimeToUtcIso` — split an ISO instant into
 *  `{ date, time }` strings suitable for repopulating the inputs. */
export const utcIsoToLocalParts = (iso) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

/** Today's `yyyy-mm-dd` in local time — for `<input type="date" min={…}>`. */
export const todayLocalDateInputValue = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** True when the (date,time) pair is at least `minLeadMinutes` from now.
 *  Defaults to 1 minute of slack so a slow click doesn't silently expire. */
export const isFutureLocalDateTime = (date, time, minLeadMinutes = 1) => {
  const iso = localDateTimeToUtcIso(date, time);
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now() + minLeadMinutes * 60_000;
};

/** Format an ISO instant as a friendly local-time string for UI surfaces.
 *  e.g. "8 May, 3:30 PM IST". Returns "—" for null/invalid input. */
export const formatScheduleForDisplay = (iso, opts = {}) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const { withTimezone = true, locale = 'en-IN' } = opts;
  const dateStr = d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
  const timeStr = d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (!withTimezone) return `${dateStr}, ${timeStr}`;
  const tzAbbrev = (() => {
    try {
      const parts = new Intl.DateTimeFormat(locale, {
        timeZoneName: 'short',
      }).formatToParts(d);
      return parts.find((p) => p.type === 'timeZoneName')?.value || '';
    } catch {
      return '';
    }
  })();
  return tzAbbrev ? `${dateStr}, ${timeStr} ${tzAbbrev}` : `${dateStr}, ${timeStr}`;
};

/** Friendly relative time — "in 2 hours", "3 minutes ago". Used for
 *  countdowns next to scheduled campaigns and for activity logs. */
export const formatRelative = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = d.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);

  const fmt = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  let phrase;
  if (absMs < 60_000) phrase = 'less than a minute';
  else if (minutes < 60) phrase = fmt(minutes, 'minute');
  else if (hours < 24) phrase = fmt(hours, 'hour');
  else phrase = fmt(days, 'day');

  return diffMs >= 0 ? `in ${phrase}` : `${phrase} ago`;
};
