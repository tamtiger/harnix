import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { nearestPaths, resolveTargetPath } from "src/core/repo-map/path-hints.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("nearestPaths", () => {
  const paths = [
    "payment/src/PaymentService.cs",
    "gateway/src/PaymentService.cs",
    "gateway/src/Other.cs",
    "docs/readme.md",
    "payment/test/PaymentServiceTests.cs",
  ];

  it("suggests the paths that end like the target, longest shared suffix first", () => {
    expect(nearestPaths(paths, "src/PaymentService.cs")).toEqual([
      "gateway/src/PaymentService.cs",
      "payment/src/PaymentService.cs",
    ]);
  });

  it("falls back to the same file name in another directory", () => {
    expect(nearestPaths(paths, "wrong/dir/Other.cs")).toEqual(["gateway/src/Other.cs"]);
  });

  it("ignores case and Windows separators and a leading ./", () => {
    expect(nearestPaths(paths, ".\\SRC\\paymentservice.cs")).toEqual([
      "gateway/src/PaymentService.cs",
      "payment/src/PaymentService.cs",
    ]);
  });

  it("returns at most three paths and nothing when no file name matches", () => {
    const many = Array.from({ length: 6 }, (_, index) => `p${index}/index.ts`);
    expect(nearestPaths(many, "index.ts")).toHaveLength(3);
    expect(nearestPaths(paths, "src/Missing.cs")).toEqual([]);
  });
});

describe("resolveTargetPath", () => {
  async function project(): Promise<string> {
    const root = await temporaryRepository();
    await mkdir(join(root, "src", "core"), { recursive: true });
    await mkdir(join(root, "src", "src"), { recursive: true });
    await writeFile(join(root, "src", "core", "a.ts"), "");
    await writeFile(join(root, "src", "core", "b.ts"), "");
    await writeFile(join(root, "b.ts"), "");
    return root;
  }

  it("turns a path relative to a sub-directory into one relative to the project root", async () => {
    const root = await project();
    expect(await resolveTargetPath(root, join(root, "src", "core"), "a.ts")).toBe("src/core/a.ts");
    expect(await resolveTargetPath(root, join(root, "src"), "core/a.ts")).toBe("src/core/a.ts");
  });

  it("keeps a path that is already relative to the project root", async () => {
    const root = await project();
    expect(await resolveTargetPath(root, join(root, "src", "core"), "src/core/a.ts")).toBe("src/core/a.ts");
    expect(await resolveTargetPath(root, join(root, "src", "core"), "b.ts")).toBe("b.ts");
    expect(await resolveTargetPath(root, root, "src/core/a.ts")).toBe("src/core/a.ts");
  });

  it("leaves an unknown path, a traversal and an absolute path for the caller to reject", async () => {
    const root = await project();
    const cwd = join(root, "src", "core");
    expect(await resolveTargetPath(root, cwd, "missing.ts")).toBe("missing.ts");
    expect(await resolveTargetPath(root, cwd, "../../../outside.ts")).toBe("../../../outside.ts");
    expect(await resolveTargetPath(root, cwd, "/etc/passwd")).toBe("/etc/passwd");
  });
});
