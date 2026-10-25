import { describe, expect, it } from "vitest";

import { FLAG_OWNERS, listed, ownerHint } from "src/commands/workflow-flag-owners.js";
import { assertCommandShape, assertFlagGroups } from "src/commands/workflow-flags.js";

describe("FLAG_OWNERS", () => {
  it("gives every flag a unique name, at least one owning action and a hint", () => {
    const names = FLAG_OWNERS.map((owner) => owner.name);

    expect(new Set(names).size).toBe(names.length);
    for (const owner of FLAG_OWNERS) {
      expect(owner.actions.length, owner.name).toBeGreaterThan(0);
      expect(ownerHint(owner), owner.name).toMatch(/^workflow /u);
    }
  });

  it("recognizes a flag only when it is set and ties --with-check and --set-criterion text to their actions", () => {
    const owner = (name: string) => FLAG_OWNERS.find((candidate) => candidate.name === name);

    expect(listed(undefined)).toBe(false);
    expect(listed([])).toBe(false);
    expect(listed(["a"])).toBe(true);
    expect(owner("--with-check")?.isSet({ withCheck: ["id=a"] })).toBe(true);
    expect(owner("--with-check")?.isSet({})).toBe(false);
    expect(owner("--with-check")?.actions).toEqual(["init"]);
    expect(owner("--text")?.actions).toContain("setCriterion");
    expect(owner("--task")?.actions).toEqual(
      expect.arrayContaining(["inspect", "setCriterion", "removeDecision", "removeCriterion"]),
    );
    expect(owner("--mitigation")?.actions).toEqual(["addRisk"]);
    expect(owner("--cwd")?.actions).toContain("init");
  });
});

describe("flags that an action would silently ignore", () => {
  it.each([
    ["schema", { schema: true, exitCode: "7" }, /--exit-code/u],
    ["schema", { schema: true, artifact: ["x"] }, /--artifact/u],
    ["schema", { schema: true, digest: "abc" }, /--digest/u],
    ["evidence", { evidence: true, check: "c", result: "pass", summary: "s", file: "e.json" }, /--file/u],
    ["cancel", { cancel: true, reason: "lý do đủ dài", file: "c.json" }, /--file/u],
    ["cancel", { cancel: true, authorizedBy: "user" }, /--authorized-by/u],
    ["evidence", { evidence: true, check: "a,b", result: "pass", summary: "s" }, /one check id/u],
    ["snapshot", { snapshot: true, check: "a,b" }, /one check id/u],
  ])("rejects workflow %s with %j", (action, flags, message) => {
    expect(() => {
      assertCommandShape(action, flags, []);
      assertFlagGroups(action, flags);
    }).toThrow(message);
  });
});
