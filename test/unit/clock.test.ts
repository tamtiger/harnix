import { describe, expect, it } from "vitest";

import {
  formatDisplay,
  formatInstant,
  idPrefix,
  isValidTimeZone,
  localDate,
  systemTimezone,
} from "../../src/utils/clock.js";

const VN = "Asia/Ho_Chi_Minh";

describe("clock", () => {
  it("formats an absolute instant with the offset of the configured zone", () => {
    const instant = Date.parse("2026-09-28T13:30:01.123Z");

    expect(formatInstant(instant, VN)).toBe("2026-09-28T20:30:01.123+07:00");
    expect(formatInstant(instant, "UTC")).toBe("2026-09-28T13:30:01.123+00:00");
    expect(Date.parse(formatInstant(instant, VN))).toBe(instant);
  });

  it("follows daylight saving offsets of a zone that has them", () => {
    expect(formatInstant(Date.parse("2026-01-15T12:00:00.000Z"), "America/New_York")).toBe(
      "2026-01-15T07:00:00.000-05:00",
    );
    expect(formatInstant(Date.parse("2026-07-15T12:00:00.000Z"), "America/New_York")).toBe(
      "2026-07-15T08:00:00.000-04:00",
    );
  });

  it("changes local date around midnight Vietnam time, not UTC midnight", () => {
    expect(localDate("2026-09-28T16:59:59.999Z", VN)).toBe("2026-09-28");
    expect(localDate("2026-09-28T17:00:00.000Z", VN)).toBe("2026-09-29");
    expect(localDate("2026-09-28T23:59:00.000+07:00", VN)).toBe("2026-09-28");
    expect(localDate("2026-09-29T00:00:00.000+07:00", VN)).toBe("2026-09-29");
  });

  it("builds the YYYYMMDD-HHMMSS id prefix in the configured zone", () => {
    expect(idPrefix(Date.parse("2026-09-28T13:30:01.000Z"), VN)).toBe("20260928-203001");
    expect(idPrefix(Date.parse("2026-09-28T17:00:00.000Z"), VN)).toBe("20260929-000000");
  });

  it("displays legacy Z timestamps in the configured zone", () => {
    expect(formatDisplay("2026-09-28T13:58:01.000Z", VN)).toBe("2026-09-28 20:58:01 +07:00");
    expect(formatDisplay("2026-09-28T20:58:01.000+07:00", VN)).toBe("2026-09-28 20:58:01 +07:00");
  });

  it("keeps mixed Z and offset timestamps ordered by absolute time", () => {
    const mixed = ["2026-09-28T20:00:00.000+07:00", "2026-09-28T12:30:00.000Z", "2026-09-28T19:00:00.000+07:00"];

    expect([...mixed].sort((left, right) => Date.parse(left) - Date.parse(right))).toEqual([
      "2026-09-28T19:00:00.000+07:00",
      "2026-09-28T12:30:00.000Z",
      "2026-09-28T20:00:00.000+07:00",
    ]);
  });

  it("validates IANA names and ignores the TZ environment variable for the system zone", () => {
    expect(isValidTimeZone(VN)).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(7)).toBe(false);
    const previous = process.env.TZ;
    process.env.TZ = "Definitely/Invalid";
    try {
      expect(isValidTimeZone(systemTimezone())).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
});
