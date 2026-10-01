import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  getTargetState,
  loadTargetStates,
  markUnownedSkillUnitCollisions,
  pathExists,
  readOptionalText,
  rootContainsOnlyOwnedLock,
} from "src/core/global/discovery.js";
import { createVerifiedUserRoot } from "src/core/platform/user-paths.js";
import { prepareDesired } from "src/core/global/desired.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-discovery-");

describe("global target discovery", () => {
  it("reads present files and reports absent ones as undefined", async () => {
    const home = await temporaryUserHome();
    await writeFile(join(home, "a.md"), "A");

    expect(await readOptionalText(join(home, "a.md"))).toBe("A");
    expect(await readOptionalText(join(home, "missing.md"))).toBeUndefined();
    expect(await pathExists(join(home, "a.md"))).toBe(true);
    expect(await pathExists(join(home, "missing.md"))).toBe(false);
  });

  it("loads target states and fails for an unresolved path", async () => {
    const home = await temporaryUserHome();
    await writeFile(join(home, "a.md"), "A");
    const states = await loadTargetStates(["a.md"], new Map([["a.md", join(home, "a.md")]]));

    expect(getTargetState(states, "a.md")).toMatchObject({ original: "A", current: "A" });
    await expect(loadTargetStates(["b.md"], new Map())).rejects.toThrow("Missing resolved");
    expect(() => getTargetState(states, "b.md")).toThrow();
  });

  it("flags an existing unowned harnix skill directory as a collision", async () => {
    const home = await temporaryUserHome();
    const root = await createVerifiedUserRoot(home, "~");
    await mkdir(join(home, "skills", "harnix-plan"), { recursive: true });
    const prepared = prepareDesired(
      [{ path: "skills/harnix-plan/SKILL.md", sourceId: "s", kind: "file", content: "x" }],
      "claude",
      "2.0.0",
    );
    const states = await loadTargetStates(
      ["skills/harnix-plan/SKILL.md"],
      new Map([["skills/harnix-plan/SKILL.md", join(home, "skills", "harnix-plan", "SKILL.md")]]),
    );

    await markUnownedSkillUnitCollisions(states, prepared, new Map(), root);

    expect(getTargetState(states, "skills/harnix-plan/SKILL.md").unownedSkillUnit).toBe(true);
  });

  it("treats a root holding only its own lock as owned-free", async () => {
    const home = await temporaryUserHome();
    const root = await createVerifiedUserRoot(home, "~");

    expect(await rootContainsOnlyOwnedLock(root, undefined, undefined, undefined)).toBe(false);
  });
});
