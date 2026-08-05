import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function findPackageJsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") {
      return [];
    }

    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return findPackageJsonFiles(entryPath);
    }

    return entry.name === "package.json" ? [entryPath] : [];
  });
}

describe("package invariant", () => {
  it("ships one publishable Harnix package and one harnix executable", () => {
    const packageJsonPath = resolve(repositoryRoot, "package.json");

    expect(existsSync(packageJsonPath)).toBe(true);
    expect(findPackageJsonFiles(repositoryRoot)).toEqual([packageJsonPath]);
    expect(existsSync(resolve(repositoryRoot, "pnpm-workspace.yaml"))).toBe(false);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      name?: string;
      private?: boolean;
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.name).toBe("@tamtiger/harnix");
    expect(packageJson.private).not.toBe(true);
    expect(packageJson.bin).toEqual({ harnix: "./dist/cli.js" });
    expect(Object.keys(packageJson.scripts ?? {}).sort()).toEqual([
      "build",
      "lint",
      "measure:footprint",
      "measure:init",
      "pack:check",
      "scan:release",
      "smoke:tarball",
      "test",
      "test:acceptance",
      "test:integration",
      "test:migration",
      "test:platform",
      "test:safety",
      "test:unit",
      "test:workflow",
      "typecheck",
    ]);
  });
});

