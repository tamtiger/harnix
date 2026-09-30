import { readdir } from "node:fs/promises";
import { join } from "node:path";

/** Directories that never carry authored source, whatever sits next to them. */
const ALWAYS_IGNORED_DIRECTORIES = ["node_modules", "TestResults", ".vs", ".idea", "__pycache__"] as const;

interface GuardedDirectoryRule {
  names: readonly string[];
  isMarker: (entryName: string) => boolean;
}

/**
 * Names that hold build output in one ecosystem and authored source in another
 * (`bin/cli.js`, `build/Build.cs`). They are skipped only when their parent
 * directory carries the marker file of the build system that produces them.
 */
const GUARDED_DIRECTORY_RULES: readonly GuardedDirectoryRule[] = [
  { names: ["bin", "obj"], isMarker: (entryName) => /\.(cs|fs|vb)proj$/iu.test(entryName) },
  {
    names: ["build", "dist", "coverage", "out"],
    isMarker: (entryName) => /^(package\.json|pom\.xml|build\.gradle(\.kts)?)$/iu.test(entryName),
  },
];

const GLOB_CHARACTERS = /[*?[\]{}()!]/u;

/** Lower-cased literal path segments of an input pattern; a leading negation and `./` never count as targeting. */
export function targetedSegments(input: string): Set<string> {
  const normalized = input.replace(/\\/gu, "/").replace(/^!+/u, "").replace(/^\.\//u, "");
  const segments = normalized
    .split("/")
    .filter((segment) => segment !== "" && !GLOB_CHARACTERS.test(segment))
    .map((segment) => segment.toLowerCase());
  return new Set(segments);
}

function caseInsensitiveSegment(name: string): string {
  return [...name]
    .map((char) => (char.toLowerCase() === char.toUpperCase() ? char : `[${char.toLowerCase()}${char.toUpperCase()}]`))
    .join("");
}

/** Glob ignores for a single input: the always-skipped names, minus any the input names on purpose. */
export function buildGlobIgnores(targeted: ReadonlySet<string>): string[] {
  const ignores = ["**/.git/**"];
  for (const name of ALWAYS_IGNORED_DIRECTORIES) {
    if (!targeted.has(name.toLowerCase())) ignores.push(`**/${caseInsensitiveSegment(name)}/**`);
  }
  if (!targeted.has(".harnix")) ignores.push("**/.harnix/**");
  return ignores;
}

/** Post-glob filter for marker-guarded directories; directory listings are cached for one digest computation. */
export function createGuardedDirectoryFilter(projectRoot: string) {
  const listings = new Map<string, Promise<readonly string[]>>();

  function list(parent: string): Promise<readonly string[]> {
    let listing = listings.get(parent);
    if (listing === undefined) {
      listing = readdir(join(projectRoot, ...parent.split("/").filter(Boolean))).catch(() => []);
      listings.set(parent, listing);
    }
    return listing;
  }

  return async function isKept(path: string, targeted: ReadonlySet<string>): Promise<boolean> {
    const segments = path.split("/");
    for (let index = 0; index < segments.length - 1; index += 1) {
      const name = (segments[index] ?? "").toLowerCase();
      if (targeted.has(name)) continue;
      const rule = GUARDED_DIRECTORY_RULES.find((candidate) => candidate.names.includes(name));
      if (rule === undefined) continue;
      const entries = await list(segments.slice(0, index).join("/"));
      if (entries.some(rule.isMarker)) return false;
    }
    return true;
  };
}
