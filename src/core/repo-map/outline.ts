import { lstat, readFile, realpath } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { assertOutlineOptions, filterSymbols, makeResult, makeSymbol, stripComments } from "./outline-helpers.js";
import {
  defaultRepoMapLimits,
  type ContainerKind,
  type RepoMapOutlineOptions,
  type RepoMapOutlineResultV1,
  type RepoMapSymbolKind,
  type RepoMapSymbolOutlineV1,
} from "./types.js";

export type { RepoMapOutlineOptions, RepoMapOutlineResultV1, RepoMapSymbolKind, RepoMapSymbolOutlineV1 };

const languageByExtension: Readonly<Record<string, string>> = Object.fromEntries(
  "cjs:javascript,cs:csharp,go:go,java:java,js:javascript,jsx:javascript,md:markdown,mdx:markdown,mjs:javascript,php:php,py:python,ts:typescript,tsx:typescript"
    .split(",")
    .map((p) => p.split(":") as [string, string]),
);
const ignoredDirs = new Set(
  ".agents,.cache,.claude,.codex,.gemini,.git,.harnix,.kilo,.kiro,.next,.pytest_cache,.trellis,.turbo,.understand-anything,.worktrees,__pycache__,bin,build,coverage,dist,node_modules,obj,vendor".split(
    ",",
  ),
);
import { secretPath } from "./inventory.js";
const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;
const reservedMethodNames = new Set("if,for,while,switch,catch,return,sizeof,typeof,new".split(","));
const topContainerRe =
  /^(?:export\s+)?(?:default\s+)?(?:public\s+|internal\s+)?(?:abstract\s+|sealed\s+|final\s+|partial\s+)?(class|interface|enum|struct|record|namespace)\s+([A-Za-z_$][\w$.\\]*)/u;
const topFnRe = /^(?:export\s+)?(?:default\s+)?(?:public\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/u;
const methodRe =
  /^(?:(?:public|private|protected|internal|static|async|override|virtual|readonly|abstract|get|set|function)\s+)*(?:[A-Za-z_$][\w$<>[\],.?]*\s+)?([A-Za-z_$][\w$]*)\s*(?:<[^>]+>)?\s*\([^)]*\)(?:[^{;]*\{|[^;]*$)/u;

export async function createRepoMapOutline(
  options: RepoMapOutlineOptions & { readonly root: string },
): Promise<RepoMapOutlineResultV1> {
  assertOutlineOptions(options);
  if (options.target.split("/").some((part) => ignoredDirs.has(part)) || secretPath.test(options.target))
    return makeResult("not-found", options);
  const resolvedRoot = resolve(options.root);
  const candidate = join(resolvedRoot, options.target);
  try {
    const [realRoot, metadata] = await Promise.all([realpath(resolvedRoot), lstat(candidate)]);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return makeResult("skipped", options);
    const rel = relative(realRoot, await realpath(candidate));
    if (rel !== "" && (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)))
      return makeResult("not-found", options);
    if (metadata.size > defaultRepoMapLimits.maxBytesPerFile) return makeResult("skipped", options);
    const raw = await readFile(candidate);
    if (raw.subarray(0, 8_192).includes(0)) return makeResult("skipped", options);
    const ext = extname(options.target).slice(1).toLowerCase();
    const all = filterSymbols(extractFileSymbols(raw.toString("utf8"), ext), options.symbol);
    const symbols = all.slice(0, options.limit);
    return makeResult("ready", options, symbols, all.length > symbols.length, languageByExtension[ext]);
  } catch (error: unknown) {
    const isMissing = typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
    return makeResult(isMissing ? "not-found" : "skipped", options);
  }
}

export function extractFileSymbols(content: string, extension: string): RepoMapSymbolOutlineV1[] {
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  const ext = extension.replace(/^\./u, "").toLowerCase();
  if (ext === "md" || ext === "mdx") return extractMarkdownSymbols(lines);
  if (ext === "py") return extractPythonSymbols(lines);
  if (ext === "go") return extractGoSymbols(lines);
  return extractBraceLanguageSymbols(lines);
}

function extractMarkdownSymbols(lines: readonly string[]): RepoMapSymbolOutlineV1[] {
  const headings: Array<{ level: number; line: number; name: string; raw: string }> = [];
  let inFence = false;
  let lastContent = 1;
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = (lines[i] ?? "").trim();
    if (trimmed.length > 0) lastContent = i + 1;
    if (/^(?:```|~~~)/u.test(trimmed)) inFence = !inFence;
    else if (!inFence && !secretValue.test(trimmed)) {
      const match = /^(#{1,6})\s+(.{1,240})$/u.exec(trimmed);
      if (match) headings.push({ level: match[1]!.length, line: i + 1, name: match[2]!.trim(), raw: trimmed });
    }
  }
  return headings.map((h, idx) => {
    const nextPeer = headings.slice(idx + 1).find((c) => c.level <= h.level);
    return makeSymbol([
      h.name,
      "heading",
      true,
      h.line,
      nextPeer ? Math.max(h.line, nextPeer.line - 1) : Math.max(h.line, lastContent),
      h.raw,
    ]);
  });
}

function extractPythonSymbols(lines: readonly string[]): RepoMapSymbolOutlineV1[] {
  const symbols: RepoMapSymbolOutlineV1[] = [];
  let activeClass: { indent: number; name: string } | undefined;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#") || secretValue.test(trimmed)) continue;
    const indent = raw.length - raw.trimStart().length;
    if (activeClass && indent <= activeClass.indent) activeClass = undefined;
    const classMatch = /^class\s+([A-Za-z_]\w*)/u.exec(trimmed);
    if (classMatch && indent === 0) {
      const name = classMatch[1]!;
      activeClass = { indent, name };
      symbols.push(makeSymbol([name, "class", !name.startsWith("_"), i + 1, findPyEnd(lines, i, indent), trimmed]));
      continue;
    }
    const defMatch = /^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/u.exec(trimmed);
    if (!defMatch) continue;
    const name = defMatch[1]!;
    const end = findPyEnd(lines, i, indent);
    if (indent === 0) symbols.push(makeSymbol([name, "function", !name.startsWith("_"), i + 1, end, trimmed]));
    else if (activeClass && indent > activeClass.indent)
      symbols.push(makeSymbol([name, "method", !name.startsWith("_"), i + 1, end, trimmed, activeClass.name]));
  }
  return symbols;
}

function findPyEnd(lines: readonly string[], startIndex: number, baseIndent: number): number {
  let endLine = startIndex + 1;
  let paren = 0;
  let inTriple = false;
  for (let i = startIndex; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (i > startIndex && !inTriple && paren === 0 && isPyBreak(raw, trimmed, baseIndent)) break;
    if (trimmed.length > 0 && !trimmed.startsWith("#")) endLine = i + 1;
    const triples = trimmed.match(/"""|'''/gu);
    if (triples && triples.length % 2 === 1) inTriple = !inTriple;
    if (!inTriple) paren = updateParenDepth(trimmed, paren);
  }
  return endLine;
}

function isPyBreak(raw: string, trimmed: string, baseIndent: number): boolean {
  return trimmed.length > 0 && !trimmed.startsWith("#") && raw.length - raw.trimStart().length <= baseIndent;
}

function updateParenDepth(line: string, current: number): number {
  let depth = current;
  for (const ch of line) {
    if ("([{".includes(ch)) depth += 1;
    else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
  }
  return depth;
}

function extractGoSymbols(lines: readonly string[]): RepoMapSymbolOutlineV1[] {
  const symbols: RepoMapSymbolOutlineV1[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = (lines[i] ?? "").trim();
    if (trimmed.length === 0 || trimmed.startsWith("//") || secretValue.test(trimmed)) continue;
    const typeMatch = /^type\s+([A-Za-z_]\w*)\s+(struct|interface|\S+)/u.exec(trimmed);
    if (typeMatch) {
      const name = typeMatch[1]!;
      const isBlock = typeMatch[2] === "struct" || typeMatch[2] === "interface";
      const kind = isBlock ? (typeMatch[2] === "interface" ? "interface" : "struct") : "type";
      const end = isBlock ? findBraceBlockEnd(lines, i) : i + 1;
      symbols.push(makeSymbol([name, kind, /^[A-Z]/u.test(name), i + 1, end, trimmed]));
      continue;
    }
    const end = findBraceBlockEnd(lines, i);
    const methodMatch = /^func\s*\(\s*(?:[A-Za-z_]\w*\s+)?\*?([A-Za-z_]\w*)\s*\)\s*([A-Za-z_]\w*)\s*\(/u.exec(trimmed);
    if (methodMatch) {
      const name = methodMatch[2]!;
      symbols.push(makeSymbol([name, "method", /^[A-Z]/u.test(name), i + 1, end, trimmed, methodMatch[1]]));
      continue;
    }
    const funcMatch = /^func\s+([A-Za-z_]\w*)\s*[([]/u.exec(trimmed);
    if (funcMatch)
      symbols.push(makeSymbol([funcMatch[1]!, "function", /^[A-Z]/u.test(funcMatch[1]!), i + 1, end, trimmed]));
  }
  return symbols;
}

function collectPrecedingAttributes(lines: readonly string[], currentIndex: number): string[] {
  const attrs: string[] = [];
  let k = currentIndex - 1;
  while (k >= 0) {
    const prev = (lines[k] ?? "").trim();
    if (prev.length === 0) break;
    if (prev.startsWith("//") || prev.startsWith("/*") || prev.startsWith("*")) break;
    if (/^\[.+\]$/u.test(prev)) {
      attrs.unshift(prev);
      k -= 1;
    } else {
      break;
    }
  }
  return attrs;
}

function tryMatchMethod(
  lines: readonly string[],
  i: number,
  trimmed: string,
  container: string,
): RepoMapSymbolOutlineV1 | undefined {
  const attrPrefix = /^(?:\[[^\]]+\]\s*)+/u;
  const matchAttr = attrPrefix.exec(trimmed);
  const methodPart = matchAttr ? trimmed.slice(matchAttr[0].length) : trimmed;
  const m = methodRe.exec(methodPart);
  if (!m || reservedMethodNames.has(m[1]!)) return undefined;
  const preceding = collectPrecedingAttributes(lines, i);
  const rawSig = preceding.length > 0 ? `${preceding.join(" ")} ${trimmed}` : trimmed;
  return makeSymbol([
    m[1]!,
    "method",
    /^public\b/u.test(methodPart),
    i + 1,
    findBraceBlockEnd(lines, i),
    rawSig,
    container,
  ]);
}

interface ScopeState {
  ns?: { endLine: number; name: string } | undefined;
  cls?: { depth: number; endLine: number; name: string } | undefined;
}

function processLineSymbol(
  lines: readonly string[],
  i: number,
  trimmed: string,
  depth: number,
  scope: ScopeState,
): RepoMapSymbolOutlineV1 | undefined {
  if (scope.ns && i + 1 > scope.ns.endLine) scope.ns = undefined;
  if (scope.cls && i + 1 > scope.cls.endLine) scope.cls = undefined;
  const isTop = scope.ns ? depth === 1 : depth === 0;
  const topSymbol = isTop ? matchTopBrace(lines, i, trimmed) : undefined;
  if (topSymbol) {
    if (topSymbol.kind === "namespace") scope.ns = { endLine: topSymbol.endLine, name: topSymbol.name };
    else if (/^(?:class|interface|struct|record)$/u.test(topSymbol.kind))
      scope.cls = { depth: depth + 1, endLine: topSymbol.endLine, name: topSymbol.name };
    return topSymbol;
  }
  return scope.cls && depth === scope.cls.depth ? tryMatchMethod(lines, i, trimmed, scope.cls.name) : undefined;
}

function extractBraceLanguageSymbols(lines: readonly string[]): RepoMapSymbolOutlineV1[] {
  const symbols: RepoMapSymbolOutlineV1[] = [];
  const scope: ScopeState = {};
  let depth = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!/^(?:$|\/\/|\*)/u.test(trimmed) && !secretValue.test(trimmed)) {
      const symbol = processLineSymbol(lines, i, trimmed, depth, scope);
      if (symbol) symbols.push(symbol);
    }
    for (const ch of stripComments(raw)) depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
    depth = Math.max(0, depth);
  }
  return symbols;
}

function matchTopBrace(lines: readonly string[], i: number, trimmed: string): RepoMapSymbolOutlineV1 | undefined {
  const attrPrefix = /^(?:\[[^\]]+\]\s*)+/u;
  const matchAttr = attrPrefix.exec(trimmed);
  const classPart = matchAttr ? trimmed.slice(matchAttr[0].length) : trimmed;
  const cMatch = topContainerRe.exec(classPart);
  if (cMatch) {
    const exp = cMatch[1] === "namespace" ? false : /^(?:export\b|public\b)/u.test(classPart);
    const preceding = collectPrecedingAttributes(lines, i);
    const rawSig = preceding.length > 0 ? `${preceding.join(" ")} ${trimmed}` : trimmed;
    return makeSymbol([cMatch[2]!, cMatch[1] as ContainerKind, exp, i + 1, findBraceBlockEnd(lines, i), rawSig]);
  }
  const exp = /^(?:export\b|public\b)/u.test(trimmed);
  const fnMatch = topFnRe.exec(trimmed);
  if (fnMatch) return makeSymbol([fnMatch[1]!, "function", exp, i + 1, findBraceBlockEnd(lines, i), trimmed]);
  const typeMatch = /^(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\b/u.exec(trimmed);
  if (typeMatch) return makeSymbol([typeMatch[1]!, "type", exp, i + 1, findStmtEnd(lines, i), trimmed]);
  const varMatch = /^(?:export\s+)?(const|let|var)\s+([A-Za-z_$][\w$]*)\b/u.exec(trimmed);
  if (varMatch) {
    const kind = varMatch[1] === "const" ? "const" : "variable";
    return makeSymbol([varMatch[2]!, kind, exp, i + 1, findStmtEnd(lines, i), trimmed]);
  }
  return undefined;
}

function findBraceBlockEnd(lines: readonly string[], startIndex: number): number {
  let balance = 0;
  let paren = 0;
  let seenOpen = false;
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = stripComments(lines[i] ?? "");
    for (const ch of line) {
      if (ch === "(") paren += 1;
      else if (ch === ")") paren = Math.max(0, paren - 1);
      else if (paren === 0 && ch === "{") {
        balance += 1;
        seenOpen = true;
      } else if (paren === 0 && ch === "}") balance -= 1;
    }
    if (seenOpen && balance <= 0) return i + 1;
    if (!seenOpen && paren === 0 && line.endsWith(";")) return i + 1;
  }
  return startIndex + 1;
}

function findStmtEnd(lines: readonly string[], start: number): number {
  if (stripComments(lines[start] ?? "").includes("{")) return findBraceBlockEnd(lines, start);
  for (let i = start; i < Math.min(lines.length, start + 25); i += 1) {
    if (stripComments(lines[i] ?? "").endsWith(";")) return i + 1;
  }
  return start + 1;
}
