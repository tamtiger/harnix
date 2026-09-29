import { describe, expect, it } from "vitest";

import { stackCatalog } from "src/catalog/catalog.js";
import type { StackCatalog } from "src/catalog/types.js";
import { CatalogValidationError, validateStackCatalog } from "src/catalog/validation.js";
import { guideSources } from "src/guides/catalog.js";

/** The packaged languages/technologies wired to the packaged guides, exactly as src/guides/catalog.ts validates them. */
const candidate = (): StackCatalog =>
  structuredClone({
    guides: guideSources.map(({ descriptor }) => descriptor),
    languages: stackCatalog.languages.map((item) => ({ ...item, guideIds: [`language-${item.id}`] })),
    technologies: stackCatalog.technologies.map((item) => ({ ...item, guideIds: [`technology-${item.id}`] })),
  });

describe("validateStackCatalog", () => {
  it("throws CatalogValidationError, a named Error subclass, for a malformed catalog", () => {
    const error = (() => {
      try {
        validateStackCatalog(null as never);
      } catch (caught: unknown) {
        return caught;
      }
      return undefined;
    })();

    expect(error).toBeInstanceOf(CatalogValidationError);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).name).toBe("CatalogValidationError");
  });

  it("requires the language, technology and guide arrays", () => {
    const missing = { languages: [], technologies: [] } as unknown as StackCatalog;

    expect(() => validateStackCatalog(missing)).toThrow(
      "Stack catalog must contain language, technology, and guide arrays.",
    );
    expect(() => validateStackCatalog([] as never)).toThrow(CatalogValidationError);
  });

  it("accepts the packaged catalog and returns a copy in deterministic code-unit order", () => {
    const input = candidate();
    input.languages.reverse();
    input.technologies.reverse();
    const before = input.languages.map(({ id }) => id);

    const result = validateStackCatalog(input);

    expect(result.languages.map(({ id }) => id)).toEqual([...before].sort());
    expect(result.technologies.map(({ id }) => id)).toEqual(result.technologies.map(({ id }) => id).sort());
    expect(input.languages.map(({ id }) => id)).toEqual(before);
    expect(result).not.toBe(input);
  });

  it("rejects an ID that is both a language and a technology", () => {
    const value = candidate();
    value.technologies[0]!.id = value.languages[0]!.id as never;

    expect(() => validateStackCatalog(value)).toThrow("Language and technology IDs must not overlap.");
  });

  it.each([
    [
      "a duplicate language ID",
      (value: StackCatalog) => value.languages.push(structuredClone(value.languages[0]!)),
      "language",
    ],
    ["a duplicate guide ID", (value: StackCatalog) => value.guides.push(structuredClone(value.guides[0]!)), "guide"],
    [
      "a non-kebab-case technology ID",
      (value: StackCatalog) => {
        value.technologies[0]!.id = "Bad_ID" as never;
      },
      "technology",
    ],
  ])("rejects %s", (_name, mutate, label) => {
    const value = candidate();
    mutate(value);

    expect(() => validateStackCatalog(value)).toThrow(`Duplicate or invalid ${label} descriptor IDs.`);
  });

  it("rejects guides that share a content path", () => {
    const value = candidate();
    value.guides[1]!.contentPath = value.guides[0]!.contentPath;

    expect(() => validateStackCatalog(value)).toThrow("Guide contentPath values must be unique.");
  });

  it("rejects an unknown technology kind and an unknown guide activation", () => {
    const badKind = candidate();
    badKind.technologies[0]!.kind = "gadget" as never;
    const badActivation = candidate();
    badActivation.guides[0]!.activation = "sometimes" as never;

    expect(() => validateStackCatalog(badKind)).toThrow("Invalid technology descriptor.");
    expect(() => validateStackCatalog(badActivation)).toThrow(CatalogValidationError);
  });

  it("rejects descriptors without provenance", () => {
    const value = candidate();
    value.technologies[0]!.provenance.license = "";

    expect(() => validateStackCatalog(value)).toThrow("Catalog provenance is required.");
  });
});
