import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Repository contract for the test suite itself (the only unit-level file that does not mirror a
 * src module): layout, size, shared builders, direct coverage of every module and a floor under the
 * amount of verification. Documented in test/README.md.
 */
const root = process.cwd();
const toPosix = (path: string): string => path.replaceAll("\\", "/");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".ts") ? [path] : [];
  });
}

const testFiles = walk(join(root, "test")).map((path) => toPosix(relative(root, path)));
const sourceFiles = walk(join(root, "src")).map((path) => toPosix(relative(root, path)));
const read = (path: string): string => readFileSync(join(root, path), "utf8").replaceAll("\r\n", "\n");
const specFiles = testFiles.filter((path) => path.endsWith(".test.ts"));

/** Line limit for any test file. */
const MAX_TEST_LINES = 400;

/**
 * Tests that intentionally write a TaskRecord/EpicRecord literal by hand instead of using
 * test/support/builders.ts, because the literal shape itself is what is under test.
 */
const RAW_RECORD_FILES: Record<string, string> = {
  "test/unit/core/tasks/task-validate.test.ts":
    "exercises the validator with deliberately malformed and legacy record shapes",
  "test/migration/legacy-data-compat.test.ts": "writes historical records to prove they stay readable",
  "test/workflow/behavior-snapshot.test.ts":
    "pure-refactor oracle: its literals are pinned to the golden and must not move with the builders",
};

/** Source modules with no test importing them directly or through a re-export barrel, and why that is acceptable. */
const UNTESTED_MODULES: Record<string, string> = {
  "src/index.ts": "package entry that only re-exports the CLI; exercised by the built-package smoke test",
  "src/types/markdown.d.ts": "ambient module declaration for raw markdown imports; no runtime code",
};

describe("test suite structure", () => {
  it("keeps only spec files and shared support helpers under test/", () => {
    const stray = testFiles.filter((path) => !path.endsWith(".test.ts") && !path.startsWith("test/support/"));

    expect(stray).toEqual([]);
  });

  it("mirrors src in test/unit and src/commands in test/integration/commands", () => {
    const unitExceptions = new Set(["test/unit/test-structure.test.ts"]);
    const unitOrphans = specFiles
      .filter((path) => path.startsWith("test/unit/") && !unitExceptions.has(path))
      .filter((path) => !sourceFiles.includes(`src/${path.slice("test/unit/".length).replace(/\.test\.ts$/u, ".ts")}`));
    const commandOrphans = specFiles
      .filter((path) => path.startsWith("test/integration/commands/"))
      .filter(
        (path) =>
          !sourceFiles.includes(
            `src/commands/${path.slice("test/integration/commands/".length).replace(/\.test\.ts$/u, ".ts")}`,
          ),
      );
    const misplaced = specFiles.filter(
      (path) => path.startsWith("test/integration/") && !/^test\/integration\/(commands|scenarios)\//u.test(path),
    );

    expect({ unitOrphans, commandOrphans, misplaced }).toEqual({ unitOrphans: [], commandOrphans: [], misplaced: [] });
  });

  it("keeps every suite in a documented directory", () => {
    const suites = new Set(specFiles.map((path) => path.split("/")[1]));
    const readme = read("test/README.md");

    expect([...suites].sort()).toEqual(["integration", "migration", "platform", "safety", "unit", "workflow"]);
    for (const suite of suites) expect(readme).toContain(`test/${suite}`);
  });

  it(`keeps every test file at ${MAX_TEST_LINES} lines or fewer`, () => {
    const tooLong = testFiles.filter((path) => read(path).split("\n").length > MAX_TEST_LINES);

    expect(tooLong).toEqual([]);
  });

  it("imports src and test modules through the src/ and test/ aliases, never through ../", () => {
    const relativeParents = testFiles.filter((path) => /(?:from|import|mock)\s*\(?\s*["']\.\.\//u.test(read(path)));

    expect(relativeParents).toEqual([]);
  });

  it("builds task and epic records with the shared builders", () => {
    const handBuilt = specFiles
      .filter((path) => !(path in RAW_RECORD_FILES))
      .filter((path) => path !== "test/unit/test-structure.test.ts")
      // A task or epic literal starts `generator, schemaVersion, id, title`; journal entries, config and expected
      // command output share the generator field but not that opening.
      .filter((path) => /generator: "harnix",\s*schemaVersion: [123],\s*id: [^\n]*\n\s*title:/u.test(read(path)));

    expect(handBuilt).toEqual([]);
    for (const [path, reason] of Object.entries(RAW_RECORD_FILES)) {
      expect(testFiles, `${path} is listed as a raw-record exception`).toContain(path);
      expect(reason.length).toBeGreaterThan(10);
    }
  });

  it("tests every source module directly or through a re-export barrel, or records why not", () => {
    const specifier = /(?:from|import|mock)\s*\(?\s*["']((?:\.{1,2}\/|src\/|test\/)[^"']*)["']/gu;
    const imported = new Set<string>();
    for (const path of testFiles) {
      for (const match of read(path).matchAll(specifier)) {
        const spec = match[1]!;
        const resolved = spec.startsWith("src/") || spec.startsWith("test/") ? spec : posix.join(dirname(path), spec);
        const target = posix.normalize(resolved).replace(/\.js$/u, ".ts");
        if (target.startsWith("src/")) imported.add(target);
      }
    }
    const reexport = /export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+["']((?:\.{1,2}\/|src\/)[^"']*)["']/gu;
    const barrels = new Map<string, string[]>();
    for (const path of sourceFiles) {
      const code = read(path)
        .replace(/\/\*[\s\S]*?\*\//gu, "")
        .replace(/^\s*\/\/.*$/gmu, "");
      if (code.replace(reexport, "").trim().length > 0) continue;
      barrels.set(
        path,
        [...code.matchAll(reexport)].map((match) =>
          posix
            .normalize(match[1]!.startsWith("src/") ? match[1]! : posix.join(dirname(path), match[1]!))
            .replace(/\.js$/u, ".ts"),
        ),
      );
    }
    // Follow barrel chains (adapter -> index -> modules) until nothing new is reached.
    for (let changed = true; changed;) {
      changed = false;
      for (const [barrel, targets] of barrels) {
        if (!imported.has(barrel)) continue;
        for (const target of targets)
          if (!imported.has(target)) {
            imported.add(target);
            changed = true;
          }
      }
    }
    // A mirrored spec (unit or command integration test) counts as testing the module even when it drives it through the CLI.
    const mirrored = (path: string): boolean =>
      specFiles.includes(`test/unit/${path.slice("src/".length).replace(/\.ts$/u, ".test.ts")}`) ||
      (path.startsWith("src/commands/") &&
        specFiles.includes(
          `test/integration/commands/${path.slice("src/commands/".length).replace(/\.ts$/u, ".test.ts")}`,
        ));
    const untested = sourceFiles.filter(
      (path) => !imported.has(path) && !mirrored(path) && !(path in UNTESTED_MODULES),
    );

    expect(untested).toEqual([]);
    for (const [path, reason] of Object.entries(UNTESTED_MODULES)) {
      expect(sourceFiles, `${path} is listed as untested`).toContain(path);
      expect(reason.length).toBeGreaterThan(10);
    }
  });

  it("never lowers the amount of verification recorded before the restructuring", () => {
    const BASELINE = { assertions: 2338, tests: 628 };
    const assertionPattern = /\bexpect(?:\.[a-zA-Z]+)?\(/gu;
    const testPattern = /\b(?:it|test)(?:\.each\([^)]*\))?\(/gu;
    const totals = testFiles.reduce(
      (sum, path) => ({
        assertions: sum.assertions + (read(path).match(assertionPattern)?.length ?? 0),
        tests: sum.tests + (read(path).match(testPattern)?.length ?? 0),
      }),
      { assertions: 0, tests: 0 },
    );

    expect(totals.assertions).toBeGreaterThanOrEqual(BASELINE.assertions);
    expect(totals.tests).toBeGreaterThanOrEqual(BASELINE.tests);
  });
});
