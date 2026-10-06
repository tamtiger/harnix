/**
 * Every module specifier a TypeScript source loads: static `import ... from`, `export ... from`, side-effect
 * `import "x"`, dynamic `import("x")` and `require("x")`, with single, double or backtick-free quoting.
 * Comments are stripped first so a commented-out import is not reported.
 */
const FROM_FORM = /(?:^|[\s;])(?:import|export)\s[^;'"]*?\sfrom\s*(["'])([^"']+)\1/gu;
const SIDE_EFFECT_FORM = /(?:^|[\s;])import\s*(["'])([^"']+)\1/gu;
const CALL_FORM = /(?:^|[^\w.$])(?:import|require)\s*\(\s*(["'`])([^"'`]+)\1\s*\)/gu;

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:\\])\/\/[^\n]*/gu, "$1");
}

export function moduleSpecifiers(source: string): string[] {
  const code = stripComments(source);
  const found = new Set<string>();
  for (const form of [FROM_FORM, SIDE_EFFECT_FORM, CALL_FORM])
    for (const match of code.matchAll(form)) found.add(match[2]!);
  return [...found];
}

/** `fs`, `fs/promises` and `node:fs...` are all direct filesystem access. */
export function isFilesystemSpecifier(specifier: string): boolean {
  return /^(?:node:)?fs(?:\/promises)?$/u.test(specifier);
}
