import { describe, expect, it } from "vitest";

import { prepareDesired } from "src/core/global/desired.js";
import { defaultJsonMemberMatcher } from "src/core/global/managed-json.js";
import { removeObsoleteEntry } from "src/core/global/obsolete.js";
import { emptyResult } from "src/core/global/reconcile.js";
import type { GlobalManagedManifestV1, TargetState } from "src/core/global/types.js";

const manifest: GlobalManagedManifestV1 = { generator: "harnix", schemaVersion: 1, platform: "kiro", entries: [] };
const [item] = prepareDesired([{ path: "a.md", sourceId: "s", kind: "file", content: "owned" }], "kiro", "2.0.0");
const entry = item!.entry;

const target = (current: string | undefined): TargetState => ({
  relativePath: "a.md",
  absolutePath: "/unused/a.md",
  original: current,
  current,
});

describe("obsolete global entries", () => {
  it("removes an unchanged owned file", () => {
    const result = emptyResult(manifest);
    const state = target("owned");

    expect(removeObsoleteEntry(state, entry, result, defaultJsonMemberMatcher)).toBe(true);
    expect(state.current).toBeUndefined();
    expect(result.deleted).toHaveLength(1);
  });

  it("keeps a file the user modified and reports it", () => {
    const result = emptyResult(manifest);
    const state = target("user edit");

    expect(removeObsoleteEntry(state, entry, result, defaultJsonMemberMatcher)).toBe(false);
    expect(state.current).toBe("user edit");
    expect(result.warnings[0]?.code).toBe("modified");
  });

  it("treats an already missing file as removed", () => {
    expect(removeObsoleteEntry(target(undefined), entry, emptyResult(manifest), defaultJsonMemberMatcher)).toBe(true);
  });
});
