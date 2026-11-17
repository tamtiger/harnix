import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";
import { extractFileSymbols } from "./outline.js";
import {
  defaultRepoMapLimits,
  type RepoMapOutlineOptions,
  type RepoMapOutlineResultV1,
  type RepoMapV1,
} from "./types.js";
import { makeResult } from "./outline-helpers.js";

/** A declaration of the requested name: the file that holds it and the line it starts on. */
export interface DeclaredTypeV1 {
  readonly path: string;
  readonly startLine: number;
}

/** The most files read to find where a name is declared. */
const MAX_FILES_READ = 20;
const TYPE_KINDS: ReadonlySet<string> = new Set(["class", "interface", "enum", "struct", "record", "type"]);
/** A bare name: no directory, no extension. Anything with a `/` or a `.` is a path, whatever it names. */
const TYPE_NAME = /^[A-Za-z_$][\w$]{0,127}$/u;

async function declaredIn(root: string, path: string, name: string): Promise<DeclaredTypeV1[]> {
  try {
    const file = join(root, path);
    if ((await stat(file)).size > defaultRepoMapLimits.maxBytesPerFile) return [];
    const extension = path.slice(path.lastIndexOf(".") + 1);
    return extractFileSymbols(await readFile(file, "utf8"), extension)
      .filter((symbol) => symbol.name === name && TYPE_KINDS.has(symbol.kind))
      .map((symbol) => ({ path, startLine: symbol.startLine }));
  } catch {
    return [];
  }
}

/** Every declaration of the class, interface, enum, struct, record or type `name`, found in the files that list the name. */
export async function findDeclaredType(root: string, map: RepoMapV1, name: string): Promise<DeclaredTypeV1[]> {
  if (!TYPE_NAME.test(name) || map.records.some((record) => record.path === name)) return [];
  const paths = map.records
    .filter((record) => record.identifiers.includes(name))
    .map((record) => record.path)
    .sort(compareCodeUnits)
    .slice(0, MAX_FILES_READ);
  const found = await Promise.all(paths.map((path) => declaredIn(root, path, name)));
  return found.flat();
}

/**
 * How `--outline <name>` reads a name that is not a path: one declaring file is the target (the answer then says what it
 * was resolved from); several files (a partial class) are listed with their lines and nothing is guessed.
 */
export function resolveTypeTarget(
  options: RepoMapOutlineOptions,
  declared: readonly DeclaredTypeV1[],
): { options: RepoMapOutlineOptions } | { result: RepoMapOutlineResultV1 } | undefined {
  const paths = [...new Set(declared.map(({ path }) => path))];
  if (paths.length === 0) return undefined;
  if (paths.length === 1) return { options: { ...options, target: paths[0] ?? options.target } };
  return {
    result: {
      ...makeResult("not-found", options),
      candidates: declared,
      hint: `${options.target} is declared in ${paths.length} files; pass one of the candidate paths to --outline`,
    },
  };
}
