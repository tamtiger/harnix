/**
 * The only place that turns an instant into text. Every persisted Harnix timestamp is
 * ISO 8601 with the offset of the configured IANA zone; comparisons elsewhere stay on
 * absolute time (`Date.parse`), so legacy `Z` values and offset values order correctly.
 */

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Resolved through Intl, never the shell `TZ` variable (Git Bash on Windows does not honor IANA names). */
export function systemTimezone(): string {
  const resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(resolved) ? resolved : "UTC";
}

interface ZonedParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  offsetMinutes: number;
}

function zonedParts(instantMs: number, timezone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instantMs)).map((part) => [part.type, part.value]));
  const wholeSecond = Math.floor(instantMs / 1000) * 1000;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    hour: parts.hour!,
    minute: parts.minute!,
    second: parts.second!,
    offsetMinutes: Math.round((asUtc - wholeSecond) / 60_000),
  };
}

function offsetText(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function toMs(instant: string | number): number {
  const ms = typeof instant === "number" ? instant : Date.parse(instant);
  if (!Number.isFinite(ms)) throw new Error("Invalid timestamp.");
  return ms;
}

/** `2026-09-28T20:30:01.123+07:00` for the given absolute instant. */
export function formatInstant(instantMs: number, timezone = "UTC"): string {
  const wholeMs = Math.floor(instantMs);
  const parts = zonedParts(wholeMs, timezone);
  const millis = String(((wholeMs % 1000) + 1000) % 1000).padStart(3, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${millis}${offsetText(parts.offsetMinutes)}`;
}

/** Calendar date (`YYYY-MM-DD`) of an instant in the configured zone, e.g. the journal partition. */
export function localDate(instant: string | number, timezone: string): string {
  const parts = zonedParts(toMs(instant), timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** `YYYYMMDD-HHMMSS` task/epic ID prefix in the configured zone. */
export function idPrefix(instantMs: number, timezone: string): string {
  const parts = zonedParts(instantMs, timezone);
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

/** Human display (`2026-09-28 20:58:01 +07:00`) that also renders legacy `Z` data in the configured zone. */
export function formatDisplay(instant: string | number, timezone: string): string {
  const ms = toMs(instant);
  const parts = zonedParts(ms, timezone);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ${offsetText(parts.offsetMinutes)}`;
}

export function nowInstant(timezone = "UTC", clock: () => number = Date.now): string {
  return formatInstant(clock(), timezone);
}
