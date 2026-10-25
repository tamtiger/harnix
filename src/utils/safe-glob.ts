type GlobNode =
  | { kind: "literal"; character: string }
  | { kind: "star" }
  | { kind: "globstar" }
  | { kind: "globstarSlashEntry" }
  | { kind: "globstarSlashInside" };

/**
 * Matches the deliberately small Harnix glob grammar for star and globstar tokens: `*` is any run without `/`,
 * `**` any run, `**` directly followed by `/` an optional run ending in `/`; every other character is literal. Globs
 * come from repository content (`.harnixignore`), so matching walks a set of positions over the path once instead of building a backtracking
 * regular expression: time stays linear in path length times glob length whatever the number of stars.
 */
export function matchesSafeGlob(path: string, glob: string): boolean {
  const nodes = compile(glob);
  let current = closure(nodes, new Set([0]));
  for (const character of path) {
    const next = new Set<number>();
    for (const state of current) step(nodes, state, character, next);
    if (next.size === 0) return false;
    current = closure(nodes, next);
  }
  return current.has(nodes.length);
}

function compile(glob: string): GlobNode[] {
  const characters = [...glob];
  const nodes: GlobNode[] = [];
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]!;
    if (character === "*" && characters[index + 1] === "*") {
      if (characters[index + 2] === "/") {
        nodes.push({ kind: "globstarSlashEntry" }, { kind: "globstarSlashInside" });
        index += 2;
      } else {
        nodes.push({ kind: "globstar" });
        index += 1;
      }
    } else nodes.push(character === "*" ? { kind: "star" } : { kind: "literal", character });
  }
  return nodes;
}

/** Adds the positions reachable without consuming a character: past a star, a globstar or an optional globstar-slash. */
function closure(nodes: readonly GlobNode[], states: Set<number>): Set<number> {
  const pending = [...states];
  while (pending.length > 0) {
    const state = pending.pop()!;
    const kind = nodes[state]?.kind;
    const skip =
      kind === "star" || kind === "globstar" ? state + 1 : kind === "globstarSlashEntry" ? state + 2 : undefined;
    if (skip !== undefined && !states.has(skip)) {
      states.add(skip);
      pending.push(skip);
    }
  }
  return states;
}

function step(nodes: readonly GlobNode[], state: number, character: string, next: Set<number>): void {
  const node = nodes[state];
  if (node === undefined) return;
  switch (node.kind) {
    case "literal":
      if (node.character === character) next.add(state + 1);
      return;
    case "star":
      if (character !== "/") next.add(state);
      return;
    case "globstar":
      next.add(state);
      return;
    case "globstarSlashEntry":
      next.add(state + 1);
      if (character === "/") next.add(state + 2);
      return;
    case "globstarSlashInside":
      next.add(state);
      if (character === "/") next.add(state + 1);
      return;
  }
}
