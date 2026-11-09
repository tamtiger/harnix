import { compareCodeUnits } from "src/utils/order.js";
import { extractRouteAndTopicIdentifiers } from "./event-discovery.js";
import { repoMapRecordLimits } from "./types.js";

export const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;

/**
 * Keeps the first `count` acceptable values in the order given (priority, then appearance) and returns them sorted by
 * code unit, which is how the cache stores every name list. Selection must not depend on the sort order.
 */
export function selectNames(values: Iterable<string>, count: number, length: number): string[] {
  const selected = new Set<string>();
  for (const raw of values) {
    const value = raw.trim();
    if (value.length === 0 || value.length > length || secretValue.test(value) || selected.has(value)) continue;
    selected.add(value);
    if (selected.size >= count) break;
  }
  return [...selected].sort(compareCodeUnits);
}

const TYPE = String.raw`[\w.]+(?:<[^<>{};()]*(?:<[^<>{};()]*>[^<>{};()]*)*>)?(?:\?|\[[\s,]*\])*`;
const ACCESS = String.raw`(?:public|internal|protected|private)`;
const MODIFIERS = String.raw`(?:(?:static|virtual|override|abstract|sealed|required|new|readonly|partial|async|final|synchronized|extern|unsafe)\s+)*`;

const declaration =
  /\b(?:class|interface|function|enum|type|namespace|record|struct|const|let|var)\s+([A-Za-z_$][\w$]*)/gu;
const csharpProperty = new RegExp(
  String.raw`\b${ACCESS}\s+${MODIFIERS}${TYPE}\s+([A-Za-z_]\w*)\s*\{\s*(?:get|set|init)\b`,
  "gu",
);
const memberMethod = new RegExp(
  String.raw`\b${ACCESS}\s+${MODIFIERS}${TYPE}\s+([A-Za-z_]\w*)\s*(?:<[^<>()]*>)?\s*\(`,
  "gu",
);
const phpProperty = /\b(?:public|protected|private)\s+(?:(?:static|readonly)\s+)*(?:[\w\\?|]+\s+)?\$([A-Za-z_]\w*)/gu;
const notMethodNames = new Set([
  "operator",
  "implicit",
  "explicit",
  "if",
  "for",
  "foreach",
  "while",
  "switch",
  "using",
  "lock",
]);

interface Match {
  readonly index: number;
  readonly name: string;
}

function matches(pattern: RegExp, content: string, skip?: ReadonlySet<string>): Match[] {
  return [...content.matchAll(pattern)].flatMap((match) => {
    const name = match[1] ?? "";
    return skip?.has(name) === true ? [] : [{ index: match.index, name }];
  });
}

function declaredNames(content: string, language: string | undefined): string[] {
  const found = [
    ...matches(declaration, content),
    ...(language === "csharp" ? matches(csharpProperty, content) : []),
    ...(language === "csharp" || language === "java" ? matches(memberMethod, content, notMethodNames) : []),
    ...(language === "php" ? matches(phpProperty, content) : []),
  ];
  return found.sort((left, right) => left.index - right.index).map((match) => match.name);
}

/** Declared names first (in order of appearance), then test references, then route and topic names. */
export function extractIdentifiers(content: string, language: string | undefined): string[] {
  const testRefs = [
    ...content.matchAll(/\b(?:new|typeof)\s+([A-Za-z_$][\w$]*)/gu),
    ...content.matchAll(/\b(?:Mock|Substitute\.For|A\.Fake)\s*<\s*([A-Za-z_$][\w$]*)/gu),
  ].map((match) => match[1] ?? "");
  const { count, length } = repoMapRecordLimits.identifiers;
  return selectNames(
    [...declaredNames(content, language), ...testRefs, ...extractRouteAndTopicIdentifiers(content)],
    count,
    length,
  );
}
