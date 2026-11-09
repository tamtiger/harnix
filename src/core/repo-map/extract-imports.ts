import { selectNames } from "./extract-symbols.js";
import { repoMapRecordLimits } from "./types.js";

function genericImports(content: string): string[] {
  const quoted = [...content.matchAll(/\b(?:from|import|require)\s*\(?\s*["']([^"']+)["']/gu)].map(
    (match) => match[1] ?? "",
  );
  const goBlocks = [...content.matchAll(/\bimport\s*\(([\s\S]*?)\)/gu)].flatMap((block) =>
    [...(block[1] ?? "").matchAll(/["']([^"']+)["']/gu)].map((match) => match[1] ?? ""),
  );
  const pythonFrom = [...content.matchAll(/\bfrom\s+([A-Za-z0-9_.-]+)\s+import\b/gu)].map((match) => match[1] ?? "");
  const pythonImport = [...content.matchAll(/^\s*import\s+([A-Za-z0-9_.-]+)/gmu)].map((match) => match[1] ?? "");
  const csharpUsing = [...content.matchAll(/^\s*(?:global\s+)?using\s+(?:static\s+)?([A-Za-z0-9_.]+)\s*;/gmu)].map(
    (match) => match[1] ?? "",
  );
  const csharpProjectRefs = [...content.matchAll(/<ProjectReference\s+Include\s*=\s*["']([^"']+)["']/giu)].map(
    (match) => (match[1] ?? "").replaceAll("\\", "/"),
  );
  return [...quoted, ...goBlocks, ...pythonFrom, ...pythonImport, ...csharpUsing, ...csharpProjectRefs];
}

/**
 * PHP has no `from "x"` import, so the generic pattern would read the table name in CodeIgniter's `->from("tbl a")` as
 * a module: it is replaced by `use`, `require`/`include` and the `->load->model|library|helper|view()` loaders.
 */
function phpImports(content: string): string[] {
  const namespaced = [
    ...content.matchAll(/^\s*use\s+(?!function\b|const\b)([A-Za-z_\\][\w\\]*)(?:\s+as\s+\w+)?\s*;/gmu),
  ].map((match) => (match[1] ?? "").replaceAll("\\", ".").replace(/^\.+/u, ""));
  const included = [
    ...content.matchAll(/\b(?:require|include)(?:_once)?\s*\(?\s*(?:[\w:]+\s*\.\s*)?["']([^"']+)["']/gu),
  ].map((match) => (match[1] ?? "").replace(/^\/+/u, ""));
  const loaded = [...content.matchAll(/->\s*load\s*->\s*(model|library|helper|view)\s*\(\s*["']([^"']+)["']/gu)].map(
    (match) => {
      const name = match[2] ?? "";
      return match[1] === "helper" && !name.endsWith("_helper") ? `${name}_helper` : name;
    },
  );
  return [...namespaced, ...included, ...loaded];
}

export function extractImports(content: string, language: string | undefined): string[] {
  const { count, length } = repoMapRecordLimits.importTargets;
  return selectNames(language === "php" ? phpImports(content) : genericImports(content), count, length);
}
