import { describe, expect, it } from "vitest";

import {
  PLATFORM_IDS,
  getPlatform,
  isPlatformId,
  parsePlatformId,
  platformRecords,
  validatePlatformRecords,
  type PlatformRecord,
} from "src/core/platform/registry.js";
import { PLATFORM_RECORDS } from "src/core/platform/records.js";

const fakeRecord: PlatformRecord = {
  id: "fakeide",
  label: "FakeIDE",
  flag: "fakeide",
  executable: null,
  roots: [{ key: "config", relativePath: ".fakeide", logicalPath: "~/.fakeide", envOverride: null }],
  skillDirectories: ["config:skills", "config:alt-skills"],
  instructionFile: null,
  contextHook: null,
  contextOutput: "plain",
  contextFirstInvocationOnly: false,
  contextRenderCap: null,
  targets: [],
  healthyReadiness: "installed",
  setupNotice: null,
  ambiguousRootEnv: null,
  shadowingFiles: [],
  facts: [
    {
      claim: "no shell hooks",
      source: "https://example.test/fakeide",
      verifiedOn: "2026-10-01",
    },
  ],
};

describe("platform registry", () => {
  it("declares exactly the six supported platforms in stable order", () => {
    expect(PLATFORM_IDS).toEqual(["kiro", "antigravity", "codex", "claude", "opencode", "cursor"]);
    expect(platformRecords().map((record) => record.id)).toEqual([...PLATFORM_IDS]);
    expect(platformRecords()).toBe(PLATFORM_RECORDS);
  });

  it("parses and guards platform ids", () => {
    expect(isPlatformId("codex")).toBe(true);
    expect(isPlatformId("opencode")).toBe(true);
    expect(isPlatformId("cursor")).toBe(true);
    expect(isPlatformId("gemini")).toBe(false);
    expect(parsePlatformId("claude")).toBe("claude");
    expect(parsePlatformId("opencode")).toBe("opencode");
    expect(() => parsePlatformId("gemini")).toThrow(
      "--platform must be kiro, antigravity, codex, claude, opencode, or cursor.",
    );
  });

  it("declares OpenCode and Cursor as hookless registry data", () => {
    expect(getPlatform("opencode").instructionFile).toBe("AGENTS.md");
    expect(getPlatform("opencode").contextHook).toBeNull();
    expect(getPlatform("opencode").contextOutput).toBe("plain");
    expect(getPlatform("opencode").roots[0]?.logicalPath).toBe("~/.config/opencode");
    expect(getPlatform("opencode").targets.map((target) => target.planKey)).toEqual(["opencode"]);
    expect(getPlatform("opencode").targets.every((target) => target.preserveUnownedRoot)).toBe(false);
    expect(getPlatform("cursor").instructionFile).toBeNull();
    expect(getPlatform("cursor").contextHook).toBeNull();
    expect(getPlatform("cursor").contextOutput).toBe("plain");
    expect(getPlatform("cursor").roots[0]?.logicalPath).toBe("~/.cursor");
    expect(getPlatform("cursor").targets.map((target) => target.planKey)).toEqual(["cursor"]);
    expect(getPlatform("cursor").setupNotice).toContain("hookless");
  });

  it("keeps the public per-platform behavior as data", () => {
    expect(getPlatform("antigravity").contextHook?.event).toBe("PreInvocation");
    expect(getPlatform("antigravity").contextOutput).toBe("antigravity-inject-steps");
    expect(getPlatform("codex").contextRenderCap).toBe(2_500);
    expect(getPlatform("codex").contextOutput).toBe("codex-additional-context");
    expect(getPlatform("claude").instructionFile).toBe("CLAUDE.md");
    expect(getPlatform("antigravity").contextFirstInvocationOnly).toBe(true);
    expect(getPlatform("kiro").contextOutput).toBe("plain");
  });

  it("declares each platform's sidecar targets and readiness as data", () => {
    expect(getPlatform("antigravity").targets.map((target) => target.globalPlatform)).toEqual([
      "antigravity-desktop",
      "antigravity-cli",
    ]);
    expect(getPlatform("antigravity").targets.every((target) => target.preserveUnownedRoot)).toBe(true);
    expect(getPlatform("codex").targets.map((target) => target.planKey)).toEqual(["codex-config", "codex-skills"]);
    expect(getPlatform("kiro").targets[0]).toMatchObject({
      manifestPath: "harnix/managed.json",
      lockPath: "harnix/managed.lock",
    });
    expect(getPlatform("codex").healthyReadiness).toBe("installed-pending-trust");
    expect(getPlatform("antigravity").healthyReadiness).toBe("precedence-unknown");
    expect(getPlatform("claude").healthyReadiness).toBe("installed");
    expect(getPlatform("codex").setupNotice).toContain("/hooks");
    expect(getPlatform("kiro").ambiguousRootEnv).toBe("KIRO_HOME");
    expect(getPlatform("codex").shadowingFiles).toEqual([
      { rootKey: "config", path: "AGENTS.override.md", code: "codex-agents-override", subject: "AGENTS override" },
    ]);
  });

  it("accepts a record for a platform with no instruction file, no hook and several skill directories", () => {
    expect(validatePlatformRecords([...platformRecords(), fakeRecord])).toEqual([]);
  });

  it("rejects duplicate ids, duplicate flags and unknown skill-directory roots", () => {
    const duplicate = validatePlatformRecords([fakeRecord, fakeRecord]);
    expect(duplicate).toContain("duplicate platform id: fakeide");
    expect(duplicate).toContain("duplicate platform flag: fakeide");

    const unknownRoot = validatePlatformRecords([{ ...fakeRecord, skillDirectories: ["missing:skills"] }]);
    expect(unknownRoot).toContain("fakeide: skill directory references unknown root missing");

    const badTarget = validatePlatformRecords([
      {
        ...fakeRecord,
        targets: [
          {
            rootKey: "nope",
            globalPlatform: "kiro",
            manifestPath: "m.json",
            lockPath: "m.lock",
            preserveUnownedRoot: false,
            planKey: "p",
          },
        ],
      },
    ]);
    expect(badTarget).toContain("fakeide: target references unknown root nope");
  });
});
