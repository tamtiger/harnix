import { describe, expect, it } from "vitest";
import { suggestSkills } from "src/commands/skills-suggest.js";

describe("suggestSkills", () => {
  it("suggests technique skill for flaky test keywords", () => {
    const result = suggestSkills("flaky test race condition");
    expect(result.generator).toBe("harnix");
    expect(result.schemaVersion).toBe(1);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]?.name).toBe("harnix-flaky-test");
  });

  it("suggests migration safety for schema evolution keywords", () => {
    const result = suggestSkills("zero downtime database schema migration");
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]?.name).toBe("harnix-migration-safety");
  });

  it("suggests security lens for path traversal or injection", () => {
    const result = suggestSkills("path traversal symlink escape shell injection");
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]?.name).toBe("harnix-security-lens");
  });

  it("suggests skill based on references like dotnet-microservices", () => {
    const result = suggestSkills("dotnet microservices kafka outbox");
    expect(result.suggestions.length).toBeGreaterThan(0);
    const names = result.suggestions.map((s) => s.name);
    expect(names).toContain("harnix-implement");
  });
});
