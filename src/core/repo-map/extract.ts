import { readFile } from "node:fs/promises";
import { basename, dirname, extname } from "node:path";

import { sha256 } from "src/utils/hashing.js";
import { compareCodeUnits } from "src/utils/order.js";
import { extractImports } from "./extract-imports.js";
import { extractIdentifiers, secretValue, selectNames } from "./extract-symbols.js";
import { repoMapRecordLimits, type RepoMapFileKind, type RepoMapInventoryFile, type RepoMapRecordV1 } from "./types.js";

const languageByExtension: Readonly<Record<string, string>> = {
  cs: "csharp",
  go: "go",
  java: "java",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  php: "php",
  py: "python",
  ts: "typescript",
  tsx: "typescript",
};
const sourceExtensions = new Set(["cs", "go", "java", "js", "jsx", "mjs", "cjs", "php", "py", "ts", "tsx"]);
const configExtensions = new Set(["json", "yaml", "yml", "toml", "ini", "xml"]);
const documentationExtensions = new Set(["md", "mdx", "rst", "txt"]);

/** A record plus the names its file uses; the names stay in memory for the reference pass and are never cached. */
export interface ExtractedRepoMapFile {
  readonly record: RepoMapRecordV1;
  readonly usedNames: ReadonlySet<string>;
}

const MAX_USED_NAMES = 1_000;
const referenceLanguages = new Set(["csharp", "go", "java", "javascript", "php", "python", "typescript"]);

function usedNamesOf(content: string, record: RepoMapRecordV1): ReadonlySet<string> {
  const names = new Set<string>();
  if (record.language === undefined || !referenceLanguages.has(record.language) || record.kind === "other")
    return names;
  for (const match of content.matchAll(/[A-Za-z_][A-Za-z0-9_]{2,95}/gu)) {
    names.add(match[0]);
    if (names.size >= MAX_USED_NAMES) break;
  }
  return names;
}

export async function extractRepoMapRecord(
  file: RepoMapInventoryFile,
  packageRoots: readonly string[],
): Promise<RepoMapRecordV1 | undefined> {
  return (await extractRepoMapFile(file, packageRoots))?.record;
}

export async function extractRepoMapFile(
  file: RepoMapInventoryFile,
  packageRoots: readonly string[],
): Promise<ExtractedRepoMapFile | undefined> {
  let content: string;
  try {
    content = await readFile(file.absolutePath, "utf8");
  } catch {
    return undefined;
  }
  if (content.includes("\0") || replacementHeavy(content)) return undefined;
  const extension = extname(file.path).slice(1).toLowerCase();
  const language = languageByExtension[extension];
  const record: RepoMapRecordV1 = {
    byteLength: file.byteLength,
    contentHash: sha256(content),
    extension,
    headings: headings(content),
    identifiers: extractIdentifiers(content, language),
    importTargets: extractImports(content, language),
    kind: fileKind(file.path, extension),
    packagePath: nearestPackage(file.path, packageRoots),
    path: file.path,
    ...(language === undefined ? {} : { language }),
  };
  return hasSensitiveOutline(record) ? undefined : { record, usedNames: usedNamesOf(content, record) };
}

function headings(content: string): string[] {
  const { count, length } = repoMapRecordLimits.headings;
  return selectNames(
    [...content.matchAll(/^#{1,6}\s+(.{1,240})$/gmu)].map((match) => match[1] ?? ""),
    count,
    length,
  );
}

function nearestPackage(path: string, roots: readonly string[]): string {
  const directory = dirname(path).replaceAll("\\", "/");
  return (
    [...roots]
      .sort((left, right) => right.length - left.length || compareCodeUnits(left, right))
      .find((root) => root === "" || directory === root || directory.startsWith(`${root}/`)) ?? ""
  );
}

function fileKind(path: string, extension: string): RepoMapFileKind {
  const normalized = path.replaceAll("\\", "/");
  const name = basename(normalized).toLowerCase();
  if (
    /(?:^|\.)test\.[^.]+$|(?:^|\.)spec\.[^.]+$|__tests__\//u.test(normalized) ||
    /^(?:test_.*|.*_test)\.[^.]+$/u.test(name) ||
    /(?:^|\/)(?:tests?|specs?)\/.*test.*\.[^.]+$/u.test(normalized) ||
    /(?:^|\/)(?:tests?|specs?)\/.*(?:test|spec)/iu.test(normalized)
  )
    return "test";
  if (
    ["package.json", "pnpm-lock.yaml", "composer.json", "go.mod", "pom.xml", "*.csproj", "*.sln"].includes(name) ||
    name.endsWith(".csproj") ||
    name.endsWith(".sln")
  )
    return "manifest";
  if (documentationExtensions.has(extension)) return "documentation";
  if (configExtensions.has(extension)) return "config";
  if (sourceExtensions.has(extension)) return "source";
  if (["sh", "ps1", "cmd", "bat"].includes(extension)) return "script";
  return "other";
}

function replacementHeavy(content: string): boolean {
  return [...content].filter((character) => character === "�").length > Math.max(8, content.length / 32);
}

function hasSensitiveOutline(record: RepoMapRecordV1): boolean {
  return [record.path, ...record.headings, ...record.identifiers, ...record.importTargets].some((value) =>
    secretValue.test(value),
  );
}
