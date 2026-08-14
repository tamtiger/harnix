import { describe, expect, it } from "vitest";

import { pathExists } from "../../src/utils/filesystem.js";

describe("filesystem probes", () => {
  it("returns false only for ENOENT", async () => {
    const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
    await expect(pathExists("fixture", async () => { throw missing; })).resolves.toBe(false);
  });

  it("propagates permission and I/O failures", async () => {
    const denied = Object.assign(new Error("denied"), { code: "EACCES" });
    await expect(pathExists("fixture", async () => { throw denied; })).rejects.toBe(denied);
  });

  it("treats every existing filesystem node as present", async () => {
    await expect(pathExists("fixture", async () => ({ isDirectory: () => true }))).resolves.toBe(true);
  });
});
