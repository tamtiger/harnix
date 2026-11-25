import { describe, expect, it } from "vitest";

const { CHECK_NAMES } = (await import(new URL("../../scripts/exercise-scaffold-docs.mjs", import.meta.url).href)) as {
  CHECK_NAMES: string[];
};

describe("scripts/exercise-scaffold-docs.mjs", () => {
  it("drives scaffold-docs through the built CLI: leave, refuse, force, a Vietnamese file, a corrupt file, Lite", () => {
    const names = CHECK_NAMES.join("\n");

    expect(names).toMatch(/leaves the unedited scaffold/u);
    expect(names).toMatch(/refused with --force in the hint/u);
    expect(names).toMatch(/--force regenerates both files/u);
    expect(names).toMatch(/Vietnamese UTF-8 text byte for byte/u);
    expect(names).toMatch(/content of its own is kept/u);
    expect(names).toMatch(/wrong encoding is refused/u);
    expect(names).toMatch(/Lite task is refused/u);
    expect(names).toMatch(/--task scaffolds a Full task that is planning but not active/u);
    expect(names).toMatch(/cancelled task is refused/u);
    expect(names).toMatch(/--force is refused without --scaffold-docs/u);
  });
});
