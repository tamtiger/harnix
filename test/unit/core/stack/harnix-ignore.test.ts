import { describe, expect, it } from "vitest";
import { parseHarnixIgnore, loadHarnixIgnore } from "src/core/stack/harnix-ignore.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const createFixture = useTemporaryRepositories("harnix-ignore-test-");

describe("parseHarnixIgnore", () => {
  it("ignores exact directory and child paths", () => {
    const ignore = parseHarnixIgnore("SignTest\n# comment\nscratch/\n");
    expect(ignore.ignores("SignTest")).toBe(true);
    expect(ignore.ignores("SignTest/SignTest.csproj")).toBe(true);
    expect(ignore.ignores("src/SignTest/file.cs")).toBe(true);
    expect(ignore.ignores("scratch/test.csx")).toBe(true);
    expect(ignore.ignores("src/Payment/PaymentAppService.cs")).toBe(false);
  });

  it("handles wildcards and globs", () => {
    const ignore = parseHarnixIgnore("*.tmp\ntemp/**\ntools/*-scratch\n");
    expect(ignore.ignores("temp/foo.json")).toBe(true);
    expect(ignore.ignores("temp/sub/bar.json")).toBe(true);
    expect(ignore.ignores("tools/test-scratch")).toBe(true);
    expect(ignore.ignores("tools/production")).toBe(false);
  });

  it("returns false when content is empty", () => {
    const ignore = parseHarnixIgnore("");
    expect(ignore.ignores("anything")).toBe(false);
    expect(ignore.patterns).toEqual([]);
  });
});

describe("loadHarnixIgnore", () => {
  it("loads .harnixignore from project root", async () => {
    const root = await createFixture();
    await writeFile(join(root, ".harnixignore"), "SignTest\ncustom-tools\n");

    const ignore = await loadHarnixIgnore(root);
    expect(ignore.patterns).toEqual(["SignTest", "custom-tools"]);
    expect(ignore.ignores("SignTest/script.cs")).toBe(true);
    expect(ignore.ignores("custom-tools/tool.exe")).toBe(true);
    expect(ignore.ignores("src/Main.cs")).toBe(false);
  });

  it("handles missing .harnixignore gracefully", async () => {
    const root = await createFixture();
    const ignore = await loadHarnixIgnore(root);
    expect(ignore.patterns).toEqual([]);
    expect(ignore.ignores("any/file.cs")).toBe(false);
  });
});
