import { describe, expect, it } from "vitest";
import { createRepoMap, validateRepoMap } from "src/core/repo-map/store.js";
import type { RepoMapRecordV1 } from "src/core/repo-map/types.js";

const validRecord: RepoMapRecordV1 = {
  path: "src/index.ts",
  contentHash: "a".repeat(64),
  byteLength: 100,
  extension: ".ts",
  packagePath: "",
  kind: "source",
  headings: [],
  identifiers: ["main"],
  importTargets: [],
};

describe("repo map store validation", () => {
  it("validates a well-formed repo map", () => {
    const map = createRepoMap([validRecord]);
    expect(validateRepoMap(map)).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      extractorVersion: 1,
    });
  });

  it("reports specific error when contentHash is not 64-character hex", () => {
    const badRecord = { ...validRecord, contentHash: "not-a-valid-hash" };
    expect(() => createRepoMap([badRecord])).toThrow(
      "Invalid repo map record: contentHash must be a 64-character hex string.",
    );
  });

  it("reports specific error when importTargets are not sorted and unique", () => {
    const badRecord = { ...validRecord, importTargets: ["z", "a"] };
    expect(() => createRepoMap([badRecord])).toThrow("Repo map importTargets must be sorted and unique.");
  });

  it("reports specific error when record path is not normalized", () => {
    const badRecord = { ...validRecord, path: "src\\index.ts" };
    expect(() => createRepoMap([badRecord])).toThrow(
      "Invalid repo map record: path must be a normalized repository path.",
    );
  });
});
