import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ConfigValidationError,
  createConfig,
  migrateConfig,
  readConfig,
  readConfigDocument,
  validateConfig,
  writeConfig,
} from "../../src/core/config/config.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-config-");

describe("Harnix config v2", () => {
  it("creates a deterministic valid default config", () => {
    expect(createConfig({ developer: "tam", languages: ["go", "go"], technologies: ["vue", "vue"], packages: [{ path: ".", languages: ["go"], technologies: ["vue"] }] })).toEqual({
      context: { maxCharacters: 24000, tokenApproximation: 4 },
      developer: "tam",
      generator: "harnix",
      languages: ["go"],
      technologies: ["vue"],
      packages: [{ languages: ["go"], path: ".", technologies: ["vue"] }],
      platforms: [],
      runtime: { fullContext: false, research: "conditional" },
      schemaVersion: 2,
    });
  });

  it.each([
    [{ developer: "invalid user" }],
    [{ languages: ["invalid"] }],
    [{ technologies: ["invalid"] }],
    [{ packages: [{ path: "../escape", languages: ["go"], technologies: [] }] }],
    [{ platforms: ["gemini"] }],
    [{ context: { maxCharacters: 0, tokenApproximation: 4 } }],
    [{ schemaVersion: 3 }],
  ])("rejects invalid config %j", (override) => {
    expect(() => validateConfig({ ...createConfig({ developer: "tam" }), ...override })).toThrow(ConfigValidationError);
  });

  it("round-trips compatible unknown keys without changing known schema values", async () => {
    const root = await createFixture();
    const path = join(root, "config.yaml");
    await writeFile(path, [
      "generator: harnix",
      "schemaVersion: 2",
      "developer: tam",
      "languages: [go]",
      "technologies: [vue]",
      "packages:",
      "  - path: .",
      "    languages: [go]",
      "    technologies: [vue]",
      "    packageNote: keep package",
      "platforms: []",
      "context: { maxCharacters: 24000, tokenApproximation: 4, contextNote: keep context }",
      "runtime: { research: conditional, fullContext: false, runtimeNote: keep runtime }",
      "futureCompatibleNote: preserve me",
      "",
    ].join("\n"));

    const config = await readConfig(path);
    await writeConfig(path, config);

    const output = await readFile(path, "utf8");
    expect(output).toContain("futureCompatibleNote: preserve me");
    expect(output).toContain("packageNote: keep package");
    expect(output).toContain("contextNote: keep context");
    expect(output).toContain("runtimeNote: keep runtime");
  });

  it("normalizes every valid v1 stack ID in memory without writing", async () => {
    const root = await createFixture();
    const path = join(root, "config.yaml");
    const original = [
      "generator: harnix", "schemaVersion: 1", "developer: tam",
      "languages: [csharp-dotnet-abp, go, java-spring, php, python, react-web, typescript-nestjs, vue]",
      "packages:", "  - path: .", "    languages: [csharp-dotnet-abp, react-web]", "    packageNote: keep",
      "platforms: []", "context: { maxCharacters: 24000, tokenApproximation: 4 }",
      "runtime: { research: conditional, fullContext: false }", "futureCompatibleNote: keep", "",
    ].join("\n");
    await writeFile(path, original);

    const document = await readConfigDocument(path);

    expect(document.sourceSchemaVersion).toBe(1);
    expect(document.config.languages).toEqual(["csharp", "go", "java", "php", "python", "typescript"]);
    expect(document.config.technologies).toEqual(["abp", "dotnet", "nestjs", "react-web", "spring", "vue"]);
    expect(document.config.packages).toEqual([{ languages: ["csharp"], packageNote: "keep", path: ".", technologies: ["abp", "dotnet", "react-web"] }]);
    await expect(readFile(path, "utf8")).resolves.toBe(original);
  });

  it("migrates v1 atomically and idempotently without rescanning", async () => {
    const root = await createFixture();
    const path = join(root, "config.yaml");
    await writeFile(path, [
      "generator: harnix", "schemaVersion: 1", "developer: tam", "languages: [typescript-nestjs]",
      "packages: [{ path: ., languages: [typescript-nestjs] }]", "platforms: []",
      "context: { maxCharacters: 24000, tokenApproximation: 4 }", "runtime: { research: conditional, fullContext: false }", "unknown: keep", "",
    ].join("\n"));

    await expect(migrateConfig(path)).resolves.toMatchObject({ status: "migrated", config: { schemaVersion: 2 } });
    const migrated = await readFile(path, "utf8");
    expect(migrated).toContain("schemaVersion: 2");
    expect(migrated).toContain("languages:\n  - typescript");
    expect(migrated).toContain("technologies:\n  - nestjs");
    expect(migrated).toContain("unknown: keep");
    await expect(migrateConfig(path)).resolves.toMatchObject({ status: "unchanged" });
    await expect(readFile(path, "utf8")).resolves.toBe(migrated);
  });

  it.each([
    ["future", "generator: harnix\nschemaVersion: 3\n"],
    ["corrupt", "generator: [invalid"],
  ])("rejects %s state before write", async (_name, content) => {
    const root = await createFixture(); const path = join(root, "config.yaml"); await writeFile(path, content);
    await expect(migrateConfig(path)).rejects.toThrow(ConfigValidationError);
    await expect(readFile(path, "utf8")).resolves.toBe(content);
  });
});


