import { describe, expect, it } from "vitest";

import { prepareDesired } from "src/core/global/desired.js";
import {
  emptyResult,
  matchesExpectedOutput,
  preserve,
  pushUnique,
  reconcileDesired,
} from "src/core/global/reconcile.js";
import type { GlobalManagedManifestV1, TargetState } from "src/core/global/types.js";
import { sha256 } from "src/utils/hashing.js";

const manifest: GlobalManagedManifestV1 = { generator: "harnix", schemaVersion: 1, platform: "kiro", entries: [] };

function fileItem(content: string) {
  const [item] = prepareDesired([{ path: "a.md", sourceId: "s", kind: "file", content }], "kiro", "2.0.0");
  return item!;
}

function target(current: string | undefined): TargetState {
  return { relativePath: "a.md", absolutePath: "/unused/a.md", original: current, current };
}

describe("global reconcile of a whole file", () => {
  it("creates a missing file", () => {
    const result = emptyResult(manifest);
    const state = target(undefined);

    reconcileDesired(state, fileItem("new"), undefined, true, result);

    expect(state.current).toBe("new");
    expect(result.created).toHaveLength(1);
  });

  it("preserves a pre-existing file Harnix does not own", () => {
    const result = emptyResult(manifest);
    const state = target("user text");

    expect(reconcileDesired(state, fileItem("new"), undefined, true, result)).toBeUndefined();

    expect(state.current).toBe("user text");
    expect(result.warnings[0]?.code).toBe("untracked-collision");
  });

  it("updates an unchanged owned file and keeps a modified one", () => {
    const owned = fileItem("old").entry;
    const next = fileItem("new");

    const updated = emptyResult(manifest);
    const unchanged = target("old");
    reconcileDesired(unchanged, next, owned, true, updated);
    expect(unchanged.current).toBe("new");
    expect(updated.updated).toHaveLength(1);

    const preserved = emptyResult(manifest);
    const edited = target("user edit");
    reconcileDesired(edited, next, { ...owned, generatedHash: sha256("old") }, true, preserved);
    expect(edited.current).toBe("user edit");
    expect(preserved.warnings[0]?.code).toBe("modified");
  });

  it("does not restore a deleted owned file unless asked", () => {
    const owned = fileItem("old").entry;
    const result = emptyResult(manifest);
    const state = target(undefined);

    reconcileDesired(state, fileItem("old"), owned, false, result);

    expect(state.current).toBeUndefined();
    expect(result.warnings[0]?.code).toBe("deleted");
  });
});

describe("global reconcile helpers", () => {
  it("collects unique labels and warnings", () => {
    const values = ["a"];
    pushUnique(values, "a");
    pushUnique(values, "b");
    expect(values).toEqual(["a", "b"]);

    const result = emptyResult(manifest);
    preserve(result, "a.md", "modified", "kept");
    expect(result.warnings).toHaveLength(1);
  });

  it("compares the current text with the expected output", () => {
    expect(matchesExpectedOutput(undefined, undefined)).toBe(true);
    expect(matchesExpectedOutput("x", "x")).toBe(true);
    expect(matchesExpectedOutput("x", undefined)).toBe(false);
  });
});
