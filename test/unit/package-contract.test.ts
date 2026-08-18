import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temporaryRepository = useTemporaryRepositories("harnix-package-contract-");
const nonProductDirectories = new Set([".artifacts", ".git", ".harnix", ".pnpm-store", "coverage", "dist", "node_modules", "test"]);

function findPackageJsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && nonProductDirectories.has(entry.name)) {
      return [];
    }

    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return findPackageJsonFiles(entryPath);
    }

    return entry.name === "package.json" ? [entryPath] : [];
  });
}

function findFiles(directory: string, extension: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findFiles(path, extension) : entry.isFile() && entry.name.endsWith(extension) ? [path] : [];
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

  it("should_ignore_non_product_package_manifests_when_checking_the_single_package_contract", async () => {
    const root = await temporaryRepository();
    const productPackage = join(root, "packages", "product", "package.json");
    const paths = [
      join(root, "package.json"),
      productPackage,
      join(root, ".harnix", "tasks", "audit", "package.json"),
      join(root, ".pnpm-store", "v11", ".tmp", "package.json"),
      join(root, "test", "fixtures", "package.json"),
    ];
    await Promise.all(paths.map(async (path) => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, "{}\n");
    }));

    expect(findPackageJsonFiles(root).sort()).toEqual([join(root, "package.json"), productPackage].sort());
  });

  it("should_avoid_locale_sensitive_primitives_in_deterministic_production_paths", () => {
    const offenders = findFiles(join(repositoryRoot, "src"), ".ts").filter((path) => /\.localeCompare\(|\.toLocale(?:Lower|Upper)Case\(/u.test(readFileSync(path, "utf8")));

    expect(offenders).toEqual([]);
  });
});

