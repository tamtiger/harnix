import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

  it("pins only the audited vulnerable transitive tool resolutions without creating a workspace", async () => {
    const pnpmfileUrl = pathToFileURL(resolve(repositoryRoot, ".pnpmfile.mjs")).href;
    const { hooks } = await import(pnpmfileUrl) as {
      hooks: {
        readPackage: (pkg: { name: string; version: string; dependencies?: Record<string, string> }) => { dependencies?: Record<string, string> };
        updateConfig: (config: { allowBuilds?: Record<string, boolean> }) => { allowBuilds?: Record<string, boolean> };
      };
    };

    expect(hooks.readPackage({ name: "tsup", version: "8.5.1", dependencies: { esbuild: "^0.27.0" } }).dependencies).toEqual({ esbuild: "0.28.1" });
    expect(hooks.readPackage({ name: "postcss", version: "8.5.25", dependencies: { nanoid: "^3.3.16" } }).dependencies).toEqual({ nanoid: "3.3.18" });
    expect(hooks.readPackage({ name: "unrelated", version: "1.0.0", dependencies: { esbuild: "^0.27.0" } }).dependencies).toEqual({ esbuild: "^0.27.0" });
    expect(hooks.updateConfig({ allowBuilds: { "unrelated-package": false } }).allowBuilds).toEqual({ esbuild: true, "unrelated-package": false });
    expect(existsSync(resolve(repositoryRoot, "pnpm-workspace.yaml"))).toBe(false);
  });
});

