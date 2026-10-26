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

// Lines of code: blank lines and comment-only lines do not count (matching eslint max-lines).
function codeLines(text: string): number {
  let inBlock = false;
  let count = 0;
  for (const raw of text.split(/\r?\n/u)) {
    const line = raw.trim();
    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.length === 0 || line.startsWith("//")) continue;
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlock = true;
      continue;
    }
    count += 1;
  }
  return count;
}

/** Line limit for any test file (measured in code lines, excluding blank lines and comments). */
const MAX_TEST_LINES = 400;
/** `vi.mock` and `vi.doMock`, with optional whitespace, line breaks and a type argument before the call. */
const MODULE_MOCK_CALL = /\bvi\s*\.\s*(?:do)?[mM]ock\s*(?:<[^>]*>)?\s*\(/u;

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
  "src/index.ts":
    "package entry that only exports packageName and packageVersion; the built entry is checked by pack:check and scan:release",
  "src/types/markdown.d.ts": "ambient module declaration for raw markdown imports; no runtime code",
};

describe("test suite structure", () => {
  it("keeps only spec files and shared support helpers under test/", () => {
    const stray = testFiles.filter((path) => !path.endsWith(".test.ts") && !path.startsWith("test/support/"));

    expect(
      stray,
      `Only *.test.ts spec files and shared helpers under test/support/** are allowed under test/. Non-spec helper files must be placed in test/support/ (e.g. test/support/my-fixture.ts). Found stray files: ${stray.join(", ")}`,
    ).toEqual([]);
  });

  it("mirrors src in test/unit and src/commands in test/integration/commands", () => {
    const unitExceptions = new Set([
      "test/unit/test-structure.test.ts",
      // Repository-contract test with no src module to mirror (documentation/platform-boundary consistency).
      "test/unit/docs/supported-platforms.test.ts",
      // Repository documentation link verification test.
      "test/unit/spec/markdown-links.test.ts",
    ]);
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

    const guideMessage = [
      "Test placement violation detected:",
      unitOrphans.length > 0
        ? `  - Unit test orphans (each unit test under test/unit/ MUST 1:1 mirror a file in src/, e.g. test/unit/foo/bar.test.ts mirrors src/foo/bar.ts): ${unitOrphans.join(", ")}`
        : "",
      commandOrphans.length > 0
        ? `  - Command test orphans (each command test under test/integration/commands/ MUST 1:1 mirror a file in src/commands/, e.g. test/integration/commands/init.test.ts mirrors src/commands/init.ts): ${commandOrphans.join(", ")}`
        : "",
      misplaced.length > 0
        ? `  - Misplaced integration tests (must be either test/integration/commands/<cmd>.test.ts or test/integration/scenarios/<flow>.test.ts): ${misplaced.join(", ")}`
        : "",
      "To avoid digest freeze or task cancellation:",
      "  - If writing a unit test for src/path/to/module.ts -> place at test/unit/path/to/module.test.ts",
      "  - If writing an integration test for command src/commands/foo.ts -> place at test/integration/commands/foo.test.ts",
      "  - If writing a multi-command integration flow -> place at test/integration/scenarios/<flow>.test.ts",
      "  - If writing a multi-module workflow scenario -> place at test/workflow/<scenario>.test.ts",
      "  - If writing shared fixtures or helper code -> place at test/support/<name>.ts",
    ]
      .filter(Boolean)
      .join("\n");

    expect({ unitOrphans, commandOrphans, misplaced }, guideMessage).toEqual({
      unitOrphans: [],
      commandOrphans: [],
      misplaced: [],
    });
  });

  it("keeps every suite in a documented directory", () => {
    const suites = new Set(specFiles.map((path) => path.split("/")[1]));
    const readme = read("test/README.md");

    expect([...suites].sort()).toEqual(["integration", "migration", "platform", "safety", "unit", "workflow"]);
    for (const suite of suites) expect(readme).toContain(`test/${suite}`);
  });

  it("recognises a module mock however it is spelled", () => {
    // Built from parts so this file does not trip the guard it tests.
    const vi = "v" + "i";
    const spelled = [
      `${vi}.mock(`,
      `${vi}.doMock(`,
      `${vi}.doMock<typeof import("x")>(`,
      `${vi}.doMock (`,
      `${vi}\n  .mock(`,
    ];
    for (const call of spelled) expect(MODULE_MOCK_CALL.test(call), call).toBe(true);
    for (const call of ["vi.fn()", "vi.spyOn(a, b)", "vi.unmock(x)", "vi.mocked(x)"])
      expect(MODULE_MOCK_CALL.test(call), call).toBe(false);
  });

  it("never mocks a whole module, since isolate: false would leak the mock into the next files of a worker", () => {
    const mocking = testFiles.filter((path) => MODULE_MOCK_CALL.test(read(path)));

    expect(mocking, "inject the dependency instead of vi.mock / vi.doMock").toEqual([]);
  });

  it(`keeps every test file at ${MAX_TEST_LINES} lines or fewer`, () => {
    const tooLong = testFiles.filter((path) => codeLines(read(path)) > MAX_TEST_LINES);

    expect(
      tooLong,
      `Every test file must be ${MAX_TEST_LINES} lines of code or fewer. Shorten or split the following files: ${tooLong.join(", ")}`,
    ).toEqual([]);
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
    const BASELINE = { assertions: 4285, tests: 1372 };
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
