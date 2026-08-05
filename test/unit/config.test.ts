import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  ConfigValidationError,
  createConfig,
  readConfig,
  validateConfig,
  writeConfig,
} from "../../src/core/config/config.js";

const temporaryDirectories: string[] = [];

async function createFixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "harnix-config-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe("Harnix config v1", () => {
  it("creates a deterministic valid default config", () => {
    expect(createConfig({ developer: "tam", languages: ["vue", "go", "vue"], packages: [{ path: ".", languages: ["go", "vue"] }] })).toEqual({
      context: { maxCharacters: 24000, tokenApproximation: 4 },
      developer: "tam",
      generator: "harnix",
      languages: ["go", "vue"],
      packages: [{ languages: ["go", "vue"], path: "." }],
      platforms: [],
      runtime: { fullContext: false, research: "conditional" },
      schemaVersion: 1,
    });
  });

  it.each([
    [{ developer: "invalid user" }],
    [{ languages: ["invalid"] }],
    [{ packages: [{ path: "../escape", languages: ["go"] }] }],
    [{ platforms: ["gemini"] }],
    [{ context: { maxCharacters: 0, tokenApproximation: 4 } }],
    [{ schemaVersion: 2 }],
  ])("rejects invalid config %j", (override) => {
    expect(() => validateConfig({ ...createConfig({ developer: "tam" }), ...override })).toThrow(ConfigValidationError);
  });

  it("round-trips compatible unknown keys without changing known schema values", async () => {
    const root = await createFixture();
    const path = join(root, "config.yaml");
    await writeFile(path, [
      "generator: harnix",
      "schemaVersion: 1",
      "developer: tam",
      "languages: [go]",
      "packages:",
      "  - path: .",
      "    languages: [go]",
      "platforms: []",
      "context: { maxCharacters: 24000, tokenApproximation: 4 }",
      "runtime: { research: conditional, fullContext: false }",
      "futureCompatibleNote: preserve me",
      "",
    ].join("\n"));

    const config = await readConfig(path);
    await writeConfig(path, config);

    await expect(readFile(path, "utf8")).resolves.toContain("futureCompatibleNote: preserve me");
  });
});


