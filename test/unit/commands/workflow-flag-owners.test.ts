import { describe, expect, it } from "vitest";

import { FLAG_OWNERS, listed } from "src/commands/workflow-flag-owners.js";

describe("FLAG_OWNERS", () => {
  it("gives every flag a unique name, at least one owning action and a hint", () => {
    const names = FLAG_OWNERS.map((owner) => owner.name);

    expect(new Set(names).size).toBe(names.length);
    for (const owner of FLAG_OWNERS) {
      expect(owner.actions.length, owner.name).toBeGreaterThan(0);
      expect(owner.hint, owner.name).toMatch(/^workflow /u);
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
    expect(owner("--task")?.actions).toContain("inspect");
  });
});
