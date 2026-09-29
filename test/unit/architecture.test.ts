import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = resolve(process.cwd(), "src");

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".ts") ? [path] : [];
  });
}

const rel = (file: string): string => relative(srcRoot, file).replaceAll("\\", "/");
const sourceFiles = walk(srcRoot);

interface ImportEdge {
  from: string;
  specifier: string;
  /** Top-level layer of a relative import (`core`, `utils`, ...), or the bare package name. */
  target: string;
}

function importEdges(): ImportEdge[] {
  const edges: ImportEdge[] = [];
  for (const file of sourceFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:import|export)\s[^;]*?from\s+"([^"]+)"/gu)) {
      const specifier = match[1]!;
      const target = specifier.startsWith(".")
        ? (
            relative(srcRoot, resolve(dirname(file), specifier))
              .replaceAll("\\", "/")
              .split("/")[0] ?? ""
          ).replace(/\.js$/u, "")
        : specifier;
      edges.push({ from: rel(file), specifier, target });
    }
  }
  return edges;
}

const edges = importEdges();
const layer = (path: string): string => path.split("/")[0]!.replace(/\.ts$/u, "");

// Lines of code: blank lines and comment-only lines (line and block comments) do not count.
function codeLines(file: string): number {
  let inBlock = false;
  let count = 0;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/u)) {
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

// These commands are owned by the later task `add-platform-registry`, which removes their direct file access.
const COMMANDS_WITH_DIRECT_FS = [
  "commands/doctor.ts",
  "commands/global-doctor.ts",
  "commands/global-update.ts",
  "commands/global-uninstall.ts",
  "commands/setup.ts",
];

describe("architecture", () => {
  it("keeps core free of commands, templates, skills and terminal UI packages", () => {
    const forbidden = new Set(["commands", "templates", "skills", "commander", "inquirer"]);
    const offenders = edges.filter(
      (edge) => layer(edge.from) === "core" && (forbidden.has(edge.target) || edge.target.startsWith("@inquirer")),
    );

    expect(offenders.map((edge) => `${edge.from} -> ${edge.specifier}`)).toEqual([]);
  });

  it("keeps utils independent of core, commands, catalog, guides, templates and configurators", () => {
    const forbidden = new Set(["core", "commands", "catalog", "guides", "templates", "configurators"]);
    const offenders = edges.filter((edge) => layer(edge.from) === "utils" && forbidden.has(edge.target));

    expect(offenders.map((edge) => `${edge.from} -> ${edge.specifier}`)).toEqual([]);
  });

  it("keeps direct filesystem access out of commands, except the platform-registry owned ones", () => {
    const offenders = edges
      .filter((edge) => layer(edge.from) === "commands" && /^node:fs(?:\/promises)?$/u.test(edge.specifier))
      .map((edge) => edge.from)
      .filter((from) => !COMMANDS_WITH_DIRECT_FS.includes(from));

    expect([...new Set(offenders)]).toEqual([]);
    for (const exempt of COMMANDS_WITH_DIRECT_FS) expect(existsSync(join(srcRoot, exempt))).toBe(true);
  });

  it("defines each canonical JSON helper exactly once", () => {
    const definitions = (name: string): string[] =>
      sourceFiles
        .filter((file) => new RegExp(`export function ${name}\\(`, "u").test(readFileSync(file, "utf8")))
        .map(rel);

    expect(definitions("canonicalJson")).toEqual(["utils/global-managed-json.ts"]);
    expect(definitions("canonicalizeJson")).toEqual(["core/tasks/workflow-helpers.ts"]);
  });

  it("keeps stack detection in core rather than utils", () => {
    expect(existsSync(join(srcRoot, "utils", "detection.ts"))).toBe(false);
    expect(existsSync(join(srcRoot, "utils", "stack.ts"))).toBe(false);
    expect(existsSync(join(srcRoot, "core", "stack", "detection.ts"))).toBe(true);
    expect(existsSync(join(srcRoot, "core", "stack", "stack.ts"))).toBe(true);
  });

  it("splits workflow and task modules into files of at most 300 lines of code", () => {
    const limited = sourceFiles.filter((file) => /^core\/(?:workflow|tasks)\//u.test(rel(file)));
    const oversized = limited.filter((file) => codeLines(file) > 300).map((file) => `${rel(file)}: ${codeLines(file)}`);

    expect(limited.length).toBeGreaterThan(0);
    expect(oversized).toEqual([]);
    expect(existsSync(join(srcRoot, "core", "workflow"))).toBe(true);
    expect(existsSync(join(srcRoot, "core", "workflow.ts"))).toBe(false);
  });

  it("leaves the workflow command as a thin adapter that only re-exports core", () => {
    const file = join(srcRoot, "commands", "internal-workflow.ts");
    const source = readFileSync(file, "utf8");

    expect(source.split(/\r?\n/u).length).toBeLessThanOrEqual(40);
    expect(source).not.toMatch(/\bfunction\b/u);
    expect(source).not.toMatch(/node:fs/u);
  });
});
