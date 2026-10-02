import { compareCodeUnits } from "src/utils/order.js";
import type { StackCatalog } from "./types.js";

export const languageIds = new Set([
  "csharp",
  "typescript",
  "javascript",
  "php",
  "python",
  "java",
  "go",
  "rust",
  "kotlin",
  "swift",
  "dart",
  "cpp",
]);

export const technologyIds = new Set([
  "dotnet",
  "abp",
  "nestjs",
  "spring",
  "react-web",
  "vue",
  "codeigniter",
  "postgresql",
  "mysql",
  "sqlserver",
  "mongodb",
  "redis",
  "nextjs",
  "fastapi",
  "django",
  "laravel",
  "express",
  "angular",
  "gin",
  "axum",
]);

export const technologyKinds = new Set([
  "framework",
  "runtime",
  "platform",
  "library",
  "database",
  "tool",
  "infrastructure",
  "domain",
]);

export const confidences = new Set(["confirmed", "probable", "weak"]);
export const ecosystems = new Set(["npm", "composer", "nuget", "maven", "gradle"]);
export const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
export const safeGlobCharacters = /^[A-Za-z0-9@._/*-]+$/u;
export const safeDependencyName = /^[A-Za-z0-9@._:/-]+$/u;

export class CatalogValidationError extends Error {
  override name = "CatalogValidationError";
}

export function validateGlob(value: string): void {
  if (
    !isNonEmpty(value) ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    !safeGlobCharacters.test(value)
  )
    throw new CatalogValidationError("Detector glob is unsafe.");
  const segments = value.split("/");
  if (
    segments.some((segment) => segment.length === 0 || segment === "." || segment === ".." || segment.includes("***"))
  )
    throw new CatalogValidationError("Detector glob is unsafe.");
}

export function validateContentPath(value: string): void {
  try {
    validateGlob(value);
  } catch {
    throw new CatalogValidationError("Guide contentPath is unsafe.");
  }
  if (
    !value.endsWith(".md") ||
    !(value === "common.md" || ["common/", "languages/", "technologies/"].some((prefix) => value.startsWith(prefix)))
  ) {
    throw new CatalogValidationError("Guide contentPath is unsafe.");
  }
}

export function assertUniqueIds(values: Array<{ id: string }>, label: string): void {
  const ids = values.map(({ id }) => id);
  if (ids.some((id) => !idPattern.test(id)) || new Set(ids).size !== ids.length)
    throw new CatalogValidationError(`Duplicate or invalid ${label} descriptor IDs.`);
}

export function assertReferences(values: string[], present: Set<string>, label: string): void {
  for (const value of values)
    if (!present.has(value)) throw new CatalogValidationError(`Missing ${label} reference: ${value}.`);
}

export function assertAcyclic(entries: Array<[string, string[]]>, label: string): void {
  const graph = new Map(entries);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new CatalogValidationError(`${label} cycle detected.`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of graph.get(id) ?? []) visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of graph.keys()) visit(id);
}

export function validateCatalogReferences(
  value: StackCatalog,
  presentLanguages: Set<string>,
  presentTechnologies: Set<string>,
  presentGuides: Set<string>,
): void {
  for (const descriptor of value.languages)
    assertReferences(descriptor.guideIds, presentGuides, `${descriptor.id} guide`);
  for (const descriptor of value.technologies) {
    assertReferences(descriptor.guideIds, presentGuides, `${descriptor.id} guide`);
    assertReferences(descriptor.implies?.languages ?? [], presentLanguages, `${descriptor.id} implied language`);
    assertReferences(
      descriptor.implies?.technologies ?? [],
      presentTechnologies,
      `${descriptor.id} implied technology`,
    );
    assertReferences(descriptor.supersedes ?? [], presentTechnologies, `${descriptor.id} superseded technology`);
  }
  for (const descriptor of value.guides) {
    assertReferences(descriptor.appliesTo.languages ?? [], presentLanguages, `${descriptor.id} language`);
    assertReferences(descriptor.appliesTo.technologies ?? [], presentTechnologies, `${descriptor.id} technology`);
    assertReferences(descriptor.extends ?? [], presentGuides, `${descriptor.id} extended guide`);
    assertReferences(descriptor.supersedes ?? [], presentGuides, `${descriptor.id} superseded guide`);
    if ((descriptor.extends ?? []).some((id) => descriptor.supersedes?.includes(id)))
      throw new CatalogValidationError(`${descriptor.id} cannot both extend and supersede the same guide.`);
  }
}

export function validateCatalogAcyclic(value: StackCatalog): void {
  assertAcyclic(
    value.technologies.map((item) => [item.id, item.implies?.technologies ?? []]),
    "technology implication",
  );
  assertAcyclic(
    value.technologies.map((item) => [item.id, item.supersedes ?? []]),
    "technology supersedence",
  );
  assertAcyclic(
    value.guides.map((item) => [item.id, item.extends ?? []]),
    "guide composition",
  );
  assertAcyclic(
    value.guides.map((item) => [item.id, item.supersedes ?? []]),
    "guide supersedence",
  );
}

export function assertUniqueStrings(values: string[], label: string): void {
  if (!Array.isArray(values) || values.some((value) => !isNonEmpty(value)) || new Set(values).size !== values.length)
    throw new CatalogValidationError(`${label} must be unique non-empty strings.`);
}

export function assertUniqueByJson(values: unknown[], label: string): void {
  const serialized = values.map((value) => JSON.stringify(value));
  if (new Set(serialized).size !== serialized.length) throw new CatalogValidationError(`${label} must be unique.`);
}

export function sorted<T extends string>(values: T[]): T[] {
  return [...values].sort(compareCodeUnits);
}

export function sortedByJson<T>(values: T[]): T[] {
  return [...values].sort((left, right) => compareCodeUnits(JSON.stringify(left), JSON.stringify(right)));
}

export function byId<T extends { id: string }>(left: T, right: T): number {
  return compareCodeUnits(left.id, right.id);
}

export function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
