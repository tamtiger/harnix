import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { attribution, composeRules, seedRules } from "../../src/rules/rules.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
describe("rule seeding", () => {
  it("seeds only detected packs and preserves modified files", async () => {
    const root = await temporaryRepository();
    const first = await seedRules({ root, languages: ["react-web", "typescript-nestjs", "react-web"] });
    expect(first.paths).toEqual([".harnix/spec/guides/common-rules.md", ".harnix/spec/guides/react-web.md", ".harnix/spec/guides/typescript-nestjs.md"]);
    expect(await readFile(join(root, ".harnix/spec/guides/react-web.md"), "utf8")).not.toContain("React Native");
    await writeFile(join(root, ".harnix/spec/guides/common-rules.md"), "user change");
    const second = await seedRules({ root, languages: ["react-web"] });
    expect(second.preserved).toContain(".harnix/spec/guides/common-rules.md");
  });
  it("applies common rules before framework-specific rules", () => { const content = composeRules(["vue"]); expect(content.indexOf("common engineering")).toBeLessThan(content.indexOf("Vue rules")); });
  it("exposes attribution metadata for adapted rule content", () => { expect(attribution.license).toContain("MIT"); expect(attribution.source).toContain("ECC"); });
});
