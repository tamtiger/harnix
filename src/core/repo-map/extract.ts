import { readFile } from "node:fs/promises";
import { basename, dirname, extname } from "node:path";

import { sha256 } from "../../utils/hashing.js";
import type { RepoMapFileKind, RepoMapInventoryFile, RepoMapRecordV1 } from "./types.js";
import { compareCodeUnits } from "../../utils/order.js";

const languageByExtension: Readonly<Record<string, string>> = {
  cs: "csharp", go: "go", java: "java", js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  php: "php", py: "python", ts: "typescript", tsx: "typescript",
};
const sourceExtensions = new Set(["cs", "go", "java", "js", "jsx", "mjs", "cjs", "php", "py", "ts", "tsx"]);
const configExtensions = new Set(["json", "yaml", "yml", "toml", "ini", "xml"]);
const documentationExtensions = new Set(["md", "mdx", "rst", "txt"]);
const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;

export async function extractRepoMapRecord(file: RepoMapInventoryFile, packageRoots: readonly string[]): Promise<RepoMapRecordV1 | undefined> {
  let content: string;
  try { content = await readFile(file.absolutePath, "utf8"); }
  catch { return undefined; }
  if (content.includes("\0") || replacementHeavy(content)) return undefined;
  const extension = extname(file.path).slice(1).toLowerCase();
  const record: RepoMapRecordV1 = {
    byteLength: file.byteLength,
    contentHash: sha256(content),
    extension,
    headings: headings(content),
    identifiers: identifiers(content),
    importTargets: imports(content),
    kind: fileKind(file.path, extension),
    packagePath: nearestPackage(file.path, packageRoots),
    path: file.path,
    ...(languageByExtension[extension] === undefined ? {} : { language: languageByExtension[extension] }),
  };
  return hasSensitiveOutline(record) ? undefined : record;
}

function headings(content: string): string[] {
  return bounded([...content.matchAll(/^#{1,6}\s+(.{1,240})$/gmu)].map((match) => match[1] ?? ""), 16, 120);
}

function identifiers(content: string): string[] {
  return bounded([...content.matchAll(/\b(?:class|interface|function|enum|type|namespace|record|struct|const|let|var)\s+([A-Za-z_$][\w$]*)/gu)].map((match) => match[1] ?? ""), 32, 96);
}

function imports(content: string): string[] {
  return bounded([...content.matchAll(/\b(?:from|import|require)\s*\(?\s*["']([^"']+)["']/gu)].map((match) => match[1] ?? ""), 32, 160);
}

function bounded(values: readonly string[], count: number, length: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0 && value.length <= length && !secretValue.test(value)))].sort(compareCodeUnits).slice(0, count);
}

function nearestPackage(path: string, roots: readonly string[]): string {
  const directory = dirname(path).replaceAll("\\", "/");
  return [...roots].sort((left, right) => right.length - left.length || compareCodeUnits(left, right)).find((root) => root === "" || directory === root || directory.startsWith(`${root}/`)) ?? "";
}

function fileKind(path: string, extension: string): RepoMapFileKind {
  const name = basename(path).toLowerCase();
  if (/(?:^|\.)test\.[^.]+$|(?:^|\.)spec\.[^.]+$|__tests__\//u.test(path)) return "test";
  if (["package.json", "pnpm-lock.yaml", "composer.json", "go.mod", "pom.xml", "*.csproj", "*.sln"].includes(name) || name.endsWith(".csproj") || name.endsWith(".sln")) return "manifest";
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
  return [record.path, ...record.headings, ...record.identifiers, ...record.importTargets].some((value) => secretValue.test(value));
}
