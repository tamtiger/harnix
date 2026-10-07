import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function headings(): Promise<{ version: string; line: string }[]> {
  const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
  return [...changelog.matchAll(/^## \[([^\]]+)\] - \d{4}-\d{2}-\d{2}$/gmu)].map((match) => ({
    version: match[1] as string,
    line: match[0],
  }));
}

describe("CHANGELOG release contract", () => {
  it("keeps the newest entry equal to the package version", async () => {
    const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { version: string };

    expect((await headings())[0]?.version).toBe(version);
  });

  it("has no entry heading twice", async () => {
    const lines = (await headings()).map(({ line }) => line);

    expect(new Set(lines).size).toBe(lines.length);
  });

  it("folds the dev entries of a release line once that release exists", async () => {
    const versions = (await headings()).map(({ version }) => version);
    const released = new Set(versions.filter((version) => !version.includes("-")));
    const unfolded = versions.filter((version) => {
      const match = /^(\d+\.\d+\.0)-dev\.\d+$/u.exec(version);
      return match !== null && released.has(match[1] as string);
    });

    expect(unfolded, "run pnpm version:sync <X.Y.0> --fold-dev to fold these").toEqual([]);
  });
});
