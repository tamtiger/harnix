import type { StackCatalog } from "./types.js";
import { validateStackCatalog } from "./validation.js";
import { catalogLanguages } from "./languages.js";
import { catalogTechnologies } from "./technologies.js";

export type * from "./types.js";
export { CatalogValidationError, validateStackCatalog } from "./validation.js";
export { catalogLanguages } from "./languages.js";
export { catalogTechnologies } from "./technologies.js";

const definition: StackCatalog = {
  guides: [],
  languages: catalogLanguages,
  technologies: catalogTechnologies,
};

export const stackCatalog = validateStackCatalog(definition);
