import { describe, expect, it } from "vitest";

import { platformRecords } from "src/core/platform/registry.js";

const isoDate = /^\d{4}-\d{2}-\d{2}$/u;

describe("platform facts", () => {
  it("gives every platform at least one dated, sourced fact", () => {
    for (const record of platformRecords()) {
      expect(record.facts.length, record.id).toBeGreaterThan(0);
      for (const fact of record.facts) {
        expect(fact.source, `${record.id}: ${fact.claim}`).toMatch(/^https:\/\//u);
        expect(fact.verifiedOn, `${record.id}: ${fact.claim}`).toMatch(isoDate);
      }
    }
  });

  it("records the verified Antigravity hook event and the Claude Code AGENTS.md limit", () => {
    const claims = platformRecords().flatMap((record) => record.facts.map((fact) => `${record.id}: ${fact.claim}`));
    expect(claims.some((claim) => claim.startsWith("antigravity:") && claim.includes("PreInvocation"))).toBe(true);
    expect(claims.some((claim) => claim.startsWith("claude:") && claim.includes("v2.1.277"))).toBe(true);
  });

  it("records the verified OpenCode and Cursor facts from official sources", () => {
    const factsFor = (id: string) => platformRecords().find((record) => record.id === id)?.facts ?? [];
    const opencode = factsFor("opencode");
    expect(opencode.some((fact) => fact.source.includes("opencode.ai"))).toBe(true);
    expect(opencode.some((fact) => fact.claim.includes("~/.config/opencode/AGENTS.md"))).toBe(true);
    const cursor = factsFor("cursor");
    expect(cursor.some((fact) => fact.source.includes("cursor.com"))).toBe(true);
    expect(cursor.some((fact) => fact.claim.includes("sessionStart") && fact.claim.includes("hookless"))).toBe(true);
  });
});
