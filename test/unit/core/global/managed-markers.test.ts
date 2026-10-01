import { describe, expect, it } from "vitest";

import {
  appendManagedBlock,
  canonicalManagedBlock,
  locateManagedBlock,
  markerTokensOverlap,
  markersOverlap,
  renderManagedBlock,
} from "src/core/global/managed-markers.js";

const selector = { type: "markers" as const, begin: "<!-- harnix:begin -->", end: "<!-- harnix:end -->" };

describe("global managed markers", () => {
  describe("markerTokensOverlap and markersOverlap", () => {
    it("treats a token contained in another as overlapping in either direction", () => {
      expect(markerTokensOverlap("<!-- harnix:begin -->", "harnix:begin")).toBe(true);
      expect(markerTokensOverlap("harnix:begin", "<!-- harnix:begin -->")).toBe(true);
      expect(markerTokensOverlap("<!-- a -->", "<!-- b -->")).toBe(false);
    });

    it("reports two selectors as overlapping when any begin or end token overlaps", () => {
      const other = { type: "markers" as const, begin: "<!-- other:begin -->", end: "<!-- harnix:end -->" };
      const disjoint = { type: "markers" as const, begin: "<!-- x:begin -->", end: "<!-- x:end -->" };

      expect(markersOverlap(selector, other)).toBe(true);
      expect(markersOverlap(selector, disjoint)).toBe(false);
      expect(markersOverlap(selector, selector)).toBe(true);
    });
  });

  describe("renderManagedBlock", () => {
    it("wraps content in the markers and normalizes line endings and outer blank lines", () => {
      expect(renderManagedBlock(selector, "\r\n\r\nline one\r\nline two\r\n\r\n")).toBe(
        "<!-- harnix:begin -->\nline one\nline two\n<!-- harnix:end -->",
      );
    });

    it("keeps interior blank lines", () => {
      expect(renderManagedBlock(selector, "a\n\nb")).toBe("<!-- harnix:begin -->\na\n\nb\n<!-- harnix:end -->");
    });
  });

  it("canonicalManagedBlock only normalizes CRLF to LF", () => {
    expect(canonicalManagedBlock("a\r\nb\r\n")).toBe("a\nb\n");
    expect(canonicalManagedBlock("\n a \n")).toBe("\n a \n");
  });

  describe("appendManagedBlock", () => {
    it("writes just the fragment into empty content", () => {
      expect(appendManagedBlock("", "BLOCK")).toBe("BLOCK\n");
    });

    it("separates the fragment from existing content with one blank line", () => {
      expect(appendManagedBlock("user text\n", "BLOCK")).toBe("user text\n\nBLOCK\n");
      expect(appendManagedBlock("user text", "BLOCK")).toBe("user text\n\nBLOCK\n");
    });
  });

  describe("locateManagedBlock", () => {
    const block = renderManagedBlock(selector, "managed");

    it("reports a missing block when neither marker is present", () => {
      expect(locateManagedBlock("just user content\n", selector)).toEqual({ kind: "missing" });
    });

    it("finds the exact span and value of a single well-formed block", () => {
      const content = `before\n${block}\nafter\n`;
      const start = content.indexOf(selector.begin);

      expect(locateManagedBlock(content, selector)).toEqual({
        kind: "found",
        start,
        end: start + block.length,
        value: block,
      });
    });

    it.each([
      ["only a begin marker", `x\n${selector.begin}\nmanaged\n`],
      ["only an end marker", `x\nmanaged\n${selector.end}\n`],
      ["the end before the begin", `${selector.end}\n${selector.begin}\n`],
      ["a duplicated begin marker", `${selector.begin}\n${block}\n`],
      ["a duplicated end marker", `${block}\n${selector.end}\n`],
    ])("reports a malformed block for %s", (_name, content) => {
      expect(locateManagedBlock(content, selector)).toEqual({ kind: "malformed" });
    });
  });
});
