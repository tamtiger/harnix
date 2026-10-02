import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import ts from "typescript";

export const potentialSecretPattern =
  /(?:api[_-]?key|password|secret|token)\s*([=:])\s*(?:['"][^'"]{8,}|([A-Za-z0-9][A-Za-z0-9._~+/-]{7,}))/giu;

// High-confidence: a fixed vendor prefix plus a structured token body. These formats are
// specific enough that a genuine TypeScript type name or identifier cannot collide with them,
// so no type-reference exclusion is needed here.
export const structuredSecretPatterns = [
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/u },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/u },
  { name: "GitHub fine-grained token", pattern: /github_pat_[A-Za-z0-9_]{22,}/u },
  { name: "Stripe live/restricted key", pattern: /(?:sk|rk)_live_[0-9a-zA-Z]{24,}/u },
  { name: "Slack token", pattern: /xox[baprs]-[0-9a-zA-Z-]{10,}/u },
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/u },
  { name: "Anthropic API key", pattern: /sk-ant-[A-Za-z0-9_-]{40,}/u },
  { name: "private key header", pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/u },
  { name: "JWT", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/u },
  // Medium-confidence: a database connection string that embeds a credential before the host.
  {
    name: "database connection string with credential",
    pattern: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|sqlserver|mssql):\/\/[^\s'"/@]+:[^\s'"/@]+@/u,
  },
];

export async function scanTextFiles(files, scope, generated) {
  for (const file of files) {
    const content = await readFile(file);
    if (content.includes(0)) continue;
    const text = content.toString("utf8");
    if (
      /(?:[A-Za-z]:[\\/]Users[\\/]|\/(?:home|Users)\/[^/]+\/|\\\\(?:\?\\[A-Za-z]:\\|[A-Za-z0-9._-]+\\[A-Za-z0-9$._-]+\\))/u.test(
        text,
      )
    )
      throw new Error(`Machine path found in ${scope}: ${file}.`);
    if (containsPotentialSecret(text, file)) throw new Error(`Potential secret found in ${scope}: ${file}.`);
    if (/(?:REQUIRED\s+TODO|TODO\s*\(required\))/iu.test(text))
      throw new Error(`Required TODO found in ${scope}: ${file}.`);
    if (generated && /gemini-cli|windsurf/iu.test(text))
      throw new Error(`Forbidden platform surface found in generated output: ${file}.`);
    if (generated && /@mindfoldhq\/trellis|@tamtiger\/trellis/iu.test(text))
      throw new Error(`Forbidden legacy product reference found in generated output: ${file}.`);
  }
}

export function containsPotentialSecret(text, file) {
  if (extname(file) === ".map") {
    const sourceMap = parseSourceMap(text);
    if (sourceMap !== undefined) {
      const metadata = JSON.stringify({ ...sourceMap, sourcesContent: [] });
      if (containsPotentialSecretText(metadata, [])) return true;
      return sourceMap.sourcesContent.some((source, index) => {
        if (typeof source !== "string") return false;
        const sourceName = typeof sourceMap.sources[index] === "string" ? sourceMap.sources[index] : "source.ts";
        return containsPotentialSecretText(source, typeReferenceRanges(source, sourceName));
      });
    }
  }
  return containsPotentialSecretText(text, []);
}

function containsPotentialSecretText(text, ignoredTypeReferenceRanges) {
  for (const match of text.matchAll(potentialSecretPattern)) {
    const [, separator, unquotedValue] = match;
    const valueStart =
      unquotedValue === undefined || match.index === undefined ? -1 : match.index + match[0].lastIndexOf(unquotedValue);
    const isTypeReference =
      valueStart >= 0 &&
      ignoredTypeReferenceRanges.some(
        ([start, end]) => valueStart >= start && valueStart + unquotedValue.length <= end,
      );
    if (separator === ":" && unquotedValue !== undefined && isTypeReference) continue;
    return true;
  }
  return structuredSecretPatterns.some(({ pattern }) => pattern.test(text));
}

function parseSourceMap(text) {
  try {
    const value = JSON.parse(text);
    if (
      typeof value !== "object" ||
      value === null ||
      !Array.isArray(value.sources) ||
      !Array.isArray(value.sourcesContent)
    )
      return undefined;
    return value;
  } catch {
    return undefined;
  }
}

function typeReferenceRanges(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const ranges = [];
  const visit = (node) => {
    if (ts.isTypeReferenceNode(node)) ranges.push([node.getStart(sourceFile), node.getEnd()]);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return ranges;
}
