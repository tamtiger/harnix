import { describe, expect, it } from "vitest";

import type {
  ContextChange,
  ContextDrift,
  ContextEntry,
  ContextManifest,
  ContextPointerOptions,
  ContextSignals,
} from "src/core/context/context-types.js";

describe("context types", () => {
  it("exports valid context type definitions", () => {
    const entry: ContextEntry = {
      path: "src/index.ts",
      reason: "primary",
      priority: 100,
      pinned: true,
      states: ["active"],
    };
    expect(entry.path).toBe("src/index.ts");

    const change: ContextChange = {
      path: "src/index.ts",
      kind: "changed",
    };
    expect(change.kind).toBe("changed");

    const drift: ContextDrift = {
      state: "current",
      changes: [change],
      selectionChanges: [],
    };
    expect(drift.state).toBe("current");

    const signals: ContextSignals = {
      taskId: "123",
      references: ["src/index.ts"],
    };
    expect(signals.taskId).toBe("123");

    const pointer: ContextPointerOptions = {
      prefixes: [".harnix/spec/guides/"],
      minCharacters: 1500,
    };
    expect(pointer.minCharacters).toBe(1500);

    const manifest: ContextManifest = {
      generator: "harnix",
      schemaVersion: 1,
      taskId: "task-1",
      maxCharacters: 1000,
      entries: [entry],
      omitted: [],
    };
    expect(manifest.generator).toBe("harnix");
  });
});
