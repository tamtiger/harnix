import type {
  DetectorExpression,
  DetectorPredicate,
  GuideDescriptor,
  LanguageDescriptor,
  Provenance,
  StackCatalog,
  TechnologyDescriptor,
} from "./types.js";
import { compareCodeUnits } from "../utils/order.js";

const languageIds = new Set(["csharp", "typescript", "javascript", "php", "python", "java", "go"]);
const technologyIds = new Set(["dotnet", "abp", "nestjs", "spring", "react-web", "vue", "codeigniter"]);
const technologyKinds = new Set(["framework", "runtime", "platform", "library", "database", "tool", "infrastructure", "domain"]);
const confidences = new Set(["confirmed", "probable", "weak"]);
const ecosystems = new Set(["npm", "composer", "nuget", "maven", "gradle"]);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const safeGlobCharacters = /^[A-Za-z0-9@._/*-]+$/u;
const safeDependencyName = /^[A-Za-z0-9@._:/-]+$/u;

export class CatalogValidationError extends Error {
  override name = "CatalogValidationError";
}

export function validateStackCatalog(value: StackCatalog): StackCatalog {
  if (!isRecord(value) || !Array.isArray(value.languages) || !Array.isArray(value.technologies) || !Array.isArray(value.guides)) {
    throw new CatalogValidationError("Stack catalog must contain language, technology, and guide arrays.");
  }

  assertUniqueIds(value.languages, "language");
  assertUniqueIds(value.technologies, "technology");
  assertUniqueIds(value.guides, "guide");
  const facetIds = [...value.languages.map(({ id }) => id), ...value.technologies.map(({ id }) => id)];
  if (new Set(facetIds).size !== facetIds.length) throw new CatalogValidationError("Language and technology IDs must not overlap.");

  for (const descriptor of value.languages) validateLanguage(descriptor);
  for (const descriptor of value.technologies) validateTechnology(descriptor);
  for (const descriptor of value.guides) validateGuide(descriptor);

  const presentLanguages = new Set(value.languages.map(({ id }) => id));
  const presentTechnologies = new Set(value.technologies.map(({ id }) => id));
  const presentGuides = new Set(value.guides.map(({ id }) => id));
  for (const descriptor of value.languages) assertReferences(descriptor.guideIds, presentGuides, `${descriptor.id} guide`);
  for (const descriptor of value.technologies) {
    assertReferences(descriptor.guideIds, presentGuides, `${descriptor.id} guide`);
    assertReferences(descriptor.implies?.languages ?? [], presentLanguages, `${descriptor.id} implied language`);
    assertReferences(descriptor.implies?.technologies ?? [], presentTechnologies, `${descriptor.id} implied technology`);
    assertReferences(descriptor.supersedes ?? [], presentTechnologies, `${descriptor.id} superseded technology`);
  }
  for (const descriptor of value.guides) {
    assertReferences(descriptor.appliesTo.languages ?? [], presentLanguages, `${descriptor.id} language`);
    assertReferences(descriptor.appliesTo.technologies ?? [], presentTechnologies, `${descriptor.id} technology`);
    assertReferences(descriptor.extends ?? [], presentGuides, `${descriptor.id} extended guide`);
    assertReferences(descriptor.supersedes ?? [], presentGuides, `${descriptor.id} superseded guide`);
    if ((descriptor.extends ?? []).some((id) => descriptor.supersedes?.includes(id))) throw new CatalogValidationError(`${descriptor.id} cannot both extend and supersede the same guide.`);
  }

  assertAcyclic(value.technologies.map((item) => [item.id, item.implies?.technologies ?? []]), "technology implication");
  assertAcyclic(value.technologies.map((item) => [item.id, item.supersedes ?? []]), "technology supersedence");
  assertAcyclic(value.guides.map((item) => [item.id, item.extends ?? []]), "guide composition");
  assertAcyclic(value.guides.map((item) => [item.id, item.supersedes ?? []]), "guide supersedence");
  const contentPaths = value.guides.map(({ contentPath }) => contentPath);
  if (new Set(contentPaths).size !== contentPaths.length) throw new CatalogValidationError("Guide contentPath values must be unique.");

  return {
    guides: value.guides.map(normalizeGuide).sort(byId),
    languages: value.languages.map(normalizeLanguage).sort(byId),
    technologies: value.technologies.map(normalizeTechnology).sort(byId),
  };
}

function validateLanguage(value: LanguageDescriptor): void {
  if (!languageIds.has(value.id) || !isNonEmpty(value.label)) throw new CatalogValidationError("Invalid language descriptor.");
  validateDescriptorCore(value);
}

function validateTechnology(value: TechnologyDescriptor): void {
  if (!technologyIds.has(value.id) || !technologyKinds.has(value.kind) || !isNonEmpty(value.label)) throw new CatalogValidationError("Invalid technology descriptor.");
  validateDescriptorCore(value);
  assertUniqueStrings(value.implies?.languages ?? [], `${value.id} implied languages`);
  assertUniqueStrings(value.implies?.technologies ?? [], `${value.id} implied technologies`);
  assertUniqueStrings(value.supersedes ?? [], `${value.id} supersedes`);
}

function validateDescriptorCore(value: Pick<LanguageDescriptor, "detectors" | "guideIds" | "provenance">): void {
  if (!Array.isArray(value.detectors)) throw new CatalogValidationError("Descriptor detectors must be an array.");
  for (const expression of value.detectors) validateExpression(expression);
  assertUniqueStrings(value.guideIds, "guideIds");
  validateProvenance(value.provenance);
}

function validateExpression(value: DetectorExpression): void {
  if (!isRecord(value) || !confidences.has(value.confidence)) throw new CatalogValidationError("Invalid detector confidence.");
  const groups = [value.allOf, value.anyOf, value.noneOf];
  for (const group of groups) {
    if (group !== undefined && (!Array.isArray(group) || group.length === 0)) throw new CatalogValidationError("Detector predicate groups must be non-empty when present.");
    for (const predicate of group ?? []) validatePredicate(predicate);
    assertUniqueByJson(group ?? [], "detector predicates");
  }
  if ((value.allOf?.length ?? 0) === 0 && (value.anyOf?.length ?? 0) === 0) throw new CatalogValidationError("Detector expressions require a positive predicate.");
}

function validatePredicate(value: DetectorPredicate): void {
  if (!isRecord(value) || !["file", "dependency", "content"].includes(String(value.kind))) throw new CatalogValidationError("Invalid detector predicate.");
  if (value.kind === "file") validateGlob(value.glob);
  if (value.kind === "dependency") {
    if (!ecosystems.has(value.ecosystem) || !isNonEmpty(value.name) || value.name.length > 200 || !safeDependencyName.test(value.name)) throw new CatalogValidationError("Invalid dependency predicate.");
  }
  if (value.kind === "content") {
    validateGlob(value.glob);
    if (!isNonEmpty(value.contains) || value.contains.length > 256 || value.contains.includes("\0")) throw new CatalogValidationError("Invalid bounded content predicate.");
  }
}

function validateGuide(value: GuideDescriptor): void {
  if (!isRecord(value) || !idPattern.test(value.id) || !isNonEmpty(value.title) || !isNonEmpty(value.description)) throw new CatalogValidationError("Invalid guide descriptor.");
  if (!["rule", "guide", "skill"].includes(value.category) || !["always", "path", "task"].includes(value.activation) || !Number.isInteger(value.priority)) throw new CatalogValidationError("Invalid guide category, activation, or priority.");
  validateContentPath(value.contentPath);
  validateProvenance(value.provenance);
  for (const path of value.appliesTo.paths ?? []) validateGlob(path);
  assertUniqueStrings(value.appliesTo.languages ?? [], `${value.id} languages`);
  assertUniqueStrings(value.appliesTo.technologies ?? [], `${value.id} technologies`);
  assertUniqueStrings(value.appliesTo.paths ?? [], `${value.id} paths`);
  assertUniqueStrings(value.appliesTo.topics ?? [], `${value.id} topics`);
  assertUniqueStrings(value.extends ?? [], `${value.id} extends`);
  assertUniqueStrings(value.supersedes ?? [], `${value.id} supersedes`);
}

function validateProvenance(value: Provenance): void {
  if (!isRecord(value) || !isNonEmpty(value.source) || !isNonEmpty(value.license) || !/^\d{4}-\d{2}-\d{2}$/u.test(value.adaptedAt) || Number.isNaN(Date.parse(`${value.adaptedAt}T00:00:00Z`))) {
    throw new CatalogValidationError("Catalog provenance is required.");
  }
}

function validateGlob(value: string): void {
  if (!isNonEmpty(value) || value.startsWith("/") || /^[A-Za-z]:/u.test(value) || value.includes("\\") || value.includes("\0") || !safeGlobCharacters.test(value)) throw new CatalogValidationError("Detector glob is unsafe.");
  const segments = value.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === ".." || segment.includes("***"))) throw new CatalogValidationError("Detector glob is unsafe.");
}

function validateContentPath(value: string): void {
  try {
    validateGlob(value);
  } catch {
    throw new CatalogValidationError("Guide contentPath is unsafe.");
  }
  if (!value.endsWith(".md") || !["common/", "languages/", "technologies/"].some((prefix) => value.startsWith(prefix))) throw new CatalogValidationError("Guide contentPath is unsafe.");
}

function normalizeLanguage(value: LanguageDescriptor): LanguageDescriptor {
  return { ...value, detectors: normalizeExpressions(value.detectors), guideIds: sorted(value.guideIds), provenance: { ...value.provenance } };
}

function normalizeTechnology(value: TechnologyDescriptor): TechnologyDescriptor {
  return {
    ...value,
    detectors: normalizeExpressions(value.detectors),
    guideIds: sorted(value.guideIds),
    provenance: { ...value.provenance },
    ...(value.implies === undefined ? {} : { implies: { ...(value.implies.languages === undefined ? {} : { languages: sorted(value.implies.languages) }), ...(value.implies.technologies === undefined ? {} : { technologies: sorted(value.implies.technologies) }) } }),
    ...(value.supersedes === undefined ? {} : { supersedes: sorted(value.supersedes) }),
  };
}

function normalizeGuide(value: GuideDescriptor): GuideDescriptor {
  return {
    ...value,
    appliesTo: {
      ...(value.appliesTo.languages === undefined ? {} : { languages: sorted(value.appliesTo.languages) }),
      ...(value.appliesTo.technologies === undefined ? {} : { technologies: sorted(value.appliesTo.technologies) }),
      ...(value.appliesTo.paths === undefined ? {} : { paths: sorted(value.appliesTo.paths) }),
      ...(value.appliesTo.topics === undefined ? {} : { topics: sorted(value.appliesTo.topics) }),
    },
    provenance: { ...value.provenance },
    ...(value.extends === undefined ? {} : { extends: sorted(value.extends) }),
    ...(value.supersedes === undefined ? {} : { supersedes: sorted(value.supersedes) }),
  };
}

function normalizeExpressions(values: DetectorExpression[]): DetectorExpression[] {
  return values.map((value) => ({
    confidence: value.confidence,
    ...(value.allOf === undefined ? {} : { allOf: sortedByJson(value.allOf) }),
    ...(value.anyOf === undefined ? {} : { anyOf: sortedByJson(value.anyOf) }),
    ...(value.noneOf === undefined ? {} : { noneOf: sortedByJson(value.noneOf) }),
  })).sort((left, right) => compareCodeUnits(JSON.stringify(left), JSON.stringify(right)));
}

function assertUniqueIds(values: Array<{ id: string }>, label: string): void {
  const ids = values.map(({ id }) => id);
  if (ids.some((id) => !idPattern.test(id)) || new Set(ids).size !== ids.length) throw new CatalogValidationError(`Duplicate or invalid ${label} descriptor IDs.`);
}

function assertReferences(values: string[], present: Set<string>, label: string): void {
  for (const value of values) if (!present.has(value)) throw new CatalogValidationError(`Missing ${label} reference: ${value}.`);
}

function assertAcyclic(entries: Array<[string, string[]]>, label: string): void {
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

function assertUniqueStrings(values: string[], label: string): void {
  if (!Array.isArray(values) || values.some((value) => !isNonEmpty(value)) || new Set(values).size !== values.length) throw new CatalogValidationError(`${label} must be unique non-empty strings.`);
}

function assertUniqueByJson(values: unknown[], label: string): void {
  const serialized = values.map((value) => JSON.stringify(value));
  if (new Set(serialized).size !== serialized.length) throw new CatalogValidationError(`${label} must be unique.`);
}

function sorted<T extends string>(values: T[]): T[] { return [...values].sort(compareCodeUnits); }
function sortedByJson<T>(values: T[]): T[] { return [...values].sort((left, right) => compareCodeUnits(JSON.stringify(left), JSON.stringify(right))); }
function byId<T extends { id: string }>(left: T, right: T): number { return compareCodeUnits(left.id, right.id); }
function isNonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
