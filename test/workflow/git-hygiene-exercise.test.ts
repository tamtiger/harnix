import { describe, expect, it } from "vitest";

const { CHECK_NAMES } = (await import(new URL("../../scripts/exercise-git-hygiene.mjs", import.meta.url).href)) as {
  CHECK_NAMES: string[];
};

describe("scripts/exercise-git-hygiene.mjs", () => {
  it("drives init, repo-map, the active pointer, update twice, a user edit, doctor and uninstall --purge", () => {
    const names = CHECK_NAMES.join("\n");

    expect(names).toMatch(/init writes both files/u);
    expect(names).toMatch(/repo-map rewrites the cache/u);
    expect(names).toMatch(/active pointer is ignored/u);
    expect(names).toMatch(/anchored.*nested cache and tmp folders stay tracked/u);
    expect(names).toMatch(/second update changes no file/u);
    expect(names).toMatch(/user-edited \.harnix\/\.gitignore survives update/u);
    expect(names).toMatch(/doctor prints the exact git command/u);
    expect(names).toMatch(/uninstall --purge removes/u);
  });
});
