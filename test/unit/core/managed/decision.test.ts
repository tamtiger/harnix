import { describe, expect, it } from "vitest";

import { decideObsoleteFile, decideWholeFile } from "src/core/managed/decision.js";
import { sha256 } from "src/utils/hashing.js";

const owned = sha256("owned");
const desired = sha256("desired");

describe("whole-file ownership decision", () => {
  it("creates a missing file that was never owned", () => {
    expect(
      decideWholeFile({ current: undefined, previousHash: undefined, desiredHash: desired, restoreDeleted: false }),
    ).toBe("create");
  });

  it("restores a deleted owned file only on request", () => {
    const input = { current: undefined, previousHash: owned, desiredHash: desired };

    expect(decideWholeFile({ ...input, restoreDeleted: true })).toBe("create");
    expect(decideWholeFile({ ...input, restoreDeleted: false })).toBe("keep-deleted");
  });

  it("never adopts an existing file that has no ownership record", () => {
    expect(
      decideWholeFile({ current: "user text", previousHash: undefined, desiredHash: desired, restoreDeleted: true }),
    ).toBe("collision");
  });

  it("keeps a file whose content no longer matches the owned hash", () => {
    expect(
      decideWholeFile({ current: "user edit", previousHash: owned, desiredHash: desired, restoreDeleted: true }),
    ).toBe("keep-modified");
  });

  it("reports unchanged when owned content already equals the desired content, otherwise updates", () => {
    expect(decideWholeFile({ current: "owned", previousHash: owned, desiredHash: owned, restoreDeleted: true })).toBe(
      "unchanged",
    );
    expect(decideWholeFile({ current: "owned", previousHash: owned, desiredHash: desired, restoreDeleted: true })).toBe(
      "update",
    );
  });
});

describe("obsolete-file ownership decision", () => {
  it("removes only content that still matches the owned hash", () => {
    expect(decideObsoleteFile("owned", owned)).toBe("remove");
    expect(decideObsoleteFile("user edit", owned)).toBe("keep-modified");
  });

  it("reports a file that is already gone separately", () => {
    expect(decideObsoleteFile(undefined, owned)).toBe("missing");
  });
});
