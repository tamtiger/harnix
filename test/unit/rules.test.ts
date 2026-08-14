import { access, mkdir, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { guideSources, selectGuideSources, type GuideSource } from "../../src/guides/catalog.js";
import { attribution, composeRules, seedRules } from "../../src/rules/rules.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("guide catalog and rule seeding", () => {
  it("selects common, language, then technology guides deterministically", () => {
    const selected = selectGuideSources({ languages: ["typescript"], technologies: ["vue", "nestjs"] });
    expect(selected.map(({ descriptor }) => descriptor.id)).toEqual([
      "common-engineering", "language-typescript", "technology-nestjs", "technology-vue",
    ]);
    expect(composeRules({ languages: ["typescript"], technologies: ["nestjs"] }).indexOf("common engineering")).toBeLessThan(composeRules({ languages: ["typescript"], technologies: ["nestjs"] }).indexOf("TypeScript"));
  });

  it("applies path/task activation, dedupe and supersedence", () => {
    const base = guideSources[0]!;
    const sources: GuideSource[] = [
      { ...base, descriptor: { ...base.descriptor, activation: "always", contentPath: "common/base.md", id: "base", supersedes: undefined } },
      { ...base, descriptor: { ...base.descriptor, activation: "path", appliesTo: { paths: ["src/**/*.ts"] }, contentPath: "common/path.md", id: "path" } },
      { ...base, descriptor: { ...base.descriptor, activation: "task", appliesTo: { topics: ["security"] }, contentPath: "common/task.md", id: "task", supersedes: ["base"] } },
    ];
    expect(selectGuideSources({ activePaths: ["src/api/main.ts"], languages: [], technologies: [], topics: ["security"] }, sources).map(({ descriptor }) => descriptor.id)).toEqual(["path", "task"]);
    expect(selectGuideSources({ activePaths: ["src/features/auth/api/main.ts"], languages: [], technologies: [] }, sources).map(({ descriptor }) => descriptor.id)).toEqual(["base", "path"]);
  });

  it("includes extended guides before the extending guide", () => {
    const base = guideSources[0]!;
    const sources: GuideSource[] = [
      { ...base, descriptor: { ...base.descriptor, appliesTo: { languages: ["go"] }, contentPath: "languages/go/base.md", id: "base" } },
      { ...base, descriptor: { ...base.descriptor, appliesTo: { technologies: ["vue"] }, contentPath: "technologies/framework/vue/specific.md", extends: ["base"], id: "specific", priority: 10 } },
    ];
    expect(selectGuideSources({ languages: [], technologies: ["vue"] }, sources).map(({ descriptor }) => descriptor.id)).toEqual(["base", "specific"]);
  });

  it("keeps extension dependencies first even when same-layer IDs sort in the opposite order", () => {
    const base = guideSources[0]!;
    const sources: GuideSource[] = [
      { ...base, descriptor: { ...base.descriptor, appliesTo: { languages: ["go"] }, contentPath: "languages/go/base.md", id: "z-base", priority: 10 } },
      { ...base, descriptor: { ...base.descriptor, appliesTo: { languages: ["go"] }, contentPath: "languages/go/specific.md", extends: ["z-base"], id: "a-specific", priority: 10 } },
    ];
    expect(selectGuideSources({ languages: ["go"], technologies: [] }, sources).map(({ descriptor }) => descriptor.id)).toEqual(["z-base", "a-specific"]);
  });

  it("seeds only selected hierarchical guides and preserves modified files", async () => {
    const root = await temporaryRepository();
    const first = await seedRules({ root, languages: ["typescript"], technologies: ["react-web", "nestjs"] });
    expect(first.paths).toEqual([
      ".harnix/spec/guides/common/engineering.md",
      ".harnix/spec/guides/languages/typescript/engineering.md",
      ".harnix/spec/guides/technologies/framework/nestjs/engineering.md",
      ".harnix/spec/guides/technologies/library/react-web/engineering.md",
    ]);
    await writeFile(join(root, ".harnix", "spec", "guides", "common", "engineering.md"), "user change");
    const second = await seedRules({ root, languages: ["typescript"], technologies: [] });
    expect(second.preserved).toContain(".harnix/spec/guides/common/engineering.md");
  });

  it("preserves an existing directory collision instead of treating it as a missing guide", async () => {
    const root = await temporaryRepository();
    const collision = join(root, ".harnix", "spec", "guides", "common", "engineering.md");
    await mkdir(collision, { recursive: true });

    const result = await seedRules({ root, languages: [], technologies: [] });

    expect(result.preserved).toContain(".harnix/spec/guides/common/engineering.md");
  });

  it("rejects an external symlink when seeding guides", async () => {
    const root = await temporaryRepository(); const external = await temporaryRepository();
    await symlink(external, join(root, ".harnix"), process.platform === "win32" ? "junction" : "dir");
    await expect(seedRules({ root, languages: ["go"], technologies: [] })).rejects.toThrow("symbolic link");
    await expect(access(join(external, "spec", "guides", "common", "engineering.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("exposes packaged content and attribution for every descriptor", async () => {
    expect(guideSources.length).toBe(15);
    expect(guideSources.every(({ content, descriptor }) => content.startsWith("# ") && descriptor.provenance.source.length > 0)).toBe(true);
    expect(attribution.license).toContain("MIT"); expect(attribution.source).toContain("ECC");
    const root = await temporaryRepository(); await seedRules({ root, languages: ["php"], technologies: ["codeigniter"] });
    await expect(readFile(join(root, ".harnix", "spec", "guides", "technologies", "framework", "codeigniter", "engineering.md"), "utf8")).resolves.toContain("CodeIgniter");
  });

  it("ships substantive, structured guidance instead of placeholder bullets", () => {
    for (const { content, descriptor } of guideSources) {
      expect(content.length, descriptor.id).toBeGreaterThanOrEqual(2_000);
      expect((content.match(/^## /gmu) ?? []).length, descriptor.id).toBeGreaterThanOrEqual(3);
      expect(content).toContain("## ");
    }
  });

  it("maps every packaged guide Markdown file to exactly one descriptor", async () => {
    const guideRoot = join(process.cwd(), "src", "guides");
    const diskPaths = (await markdownFiles(guideRoot)).map((path) => relative(guideRoot, path).replaceAll("\\", "/")).sort();
    expect(diskPaths).toEqual(guideSources.map(({ descriptor }) => descriptor.contentPath).sort());
  });
});

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? markdownFiles(join(directory, entry.name)) : entry.isFile() && entry.name.endsWith(".md") ? [join(directory, entry.name)] : []));
  return nested.flat();
}
