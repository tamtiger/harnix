import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PROJECT_FACTS_PATH,
  renderProjectFacts,
  writeProjectFacts,
  type ProjectFactsInput,
  type ProjectFactsPlan,
} from "src/core/spec/project-facts.js";
import { createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const stack: ProjectFactsInput = {
  languages: ["typescript", "go"],
  technologies: ["nestjs"],
  packages: [
    { path: ".", languages: ["typescript"], technologies: ["nestjs"] },
    { path: "services/api", languages: ["go"], technologies: [] },
  ],
};
const plan: ProjectFactsPlan = {
  hasTests: true,
  commands: { test: "pnpm run test", lint: "pnpm run lint", typecheck: "pnpm run typecheck" },
  packages: [{ path: "services/api", ecosystem: "go", hasTests: true, commands: { test: "go test ./..." } }],
  warnings: [],
};

describe("renderProjectFacts", () => {
  it("lists the confirmed stack and the verify commands per package", () => {
    const text = renderProjectFacts(stack, plan);

    expect(text.startsWith("# Project facts\n")).toBe(true);
    expect(text).toContain("`harnix init` and `harnix update`");
    expect(text).toContain("- Languages: typescript, go");
    expect(text).toContain("- Technologies: nestjs");
    expect(text).toContain("- `services/api`: go");
    expect(text).toContain("- project: test `pnpm run test`; lint `pnpm run lint`; typecheck `pnpm run typecheck`");
    expect(text).toContain("- `services/api` (go): test `go test ./...`");
    expect(text).not.toContain("## Warnings");
  });

  it("is deterministic and carries no timestamp or version", () => {
    expect(renderProjectFacts(stack, plan)).toBe(renderProjectFacts(stack, plan));
    expect(renderProjectFacts(stack, plan)).not.toMatch(/\d{4}-\d{2}-\d{2}|2\.0\.0/u);
  });

  it("says so when nothing was detected and reports warnings", () => {
    const text = renderProjectFacts(
      { languages: [], technologies: [], packages: [] },
      { hasTests: false, commands: {}, packages: [], warnings: ["No tests detected in repository."] },
    );

    expect(text).toContain("- Languages: none");
    expect(text).toContain("- Technologies: none");
    expect(text).toContain("- project: none detected");
    expect(text).toContain("## Warnings");
    expect(text).toContain("- No tests detected in repository.");
  });

  it("caps the package lists and says how many were left out", () => {
    const many = Array.from({ length: 25 }, (_, index) => `pkg/p${String(index).padStart(2, "0")}`);
    const text = renderProjectFacts(
      {
        languages: ["go"],
        technologies: [],
        packages: many.map((path) => ({ path, languages: ["go"], technologies: [] })),
      },
      {
        hasTests: true,
        commands: {},
        packages: many.map((path) => ({ path, hasTests: true, commands: { test: "go test ./..." } })),
        warnings: [],
      },
    );

    expect(text).toContain("`pkg/p19`");
    expect(text).not.toContain("`pkg/p20`");
    expect(text.match(/- and 5 more packages/gu)).toHaveLength(2);
  });
});

describe("writeProjectFacts", () => {
  it("creates the file, leaves an identical one alone and rewrites a modified one", async () => {
    const root = await temporaryRepository();
    await createTestProject(root);
    const path = join(root, PROJECT_FACTS_PATH);
    await rm(path, { force: true });

    expect(await writeProjectFacts(root)).toBe("created");
    const first = await readFile(path, "utf8");
    expect(first).toContain("# Project facts");
    expect(await writeProjectFacts(root)).toBe("unchanged");

    await writeFile(path, "edited by hand\n");
    expect(await writeProjectFacts(root)).toBe("updated");
    expect(await readFile(path, "utf8")).toBe(first);
  });

  it("creates the spec directory when it is missing", async () => {
    const root = await temporaryRepository();
    await createTestProject(root);
    await rm(join(root, ".harnix", "spec"), { recursive: true, force: true });
    await mkdir(join(root, ".harnix"), { recursive: true });

    expect(await writeProjectFacts(root)).toBe("created");
    await expect(readFile(join(root, PROJECT_FACTS_PATH), "utf8")).resolves.toContain("## Stack");
  });
});
