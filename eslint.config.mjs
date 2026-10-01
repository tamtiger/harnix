import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/*
 * Temporary exemptions. Each list names the task that must delete it together with the code
 * change that makes it unnecessary; an entry may only be removed, never added, without a new
 * decision recorded in docs/OVERHAUL_DECISIONS.md.
 */

// Removed by `rewrite-guides` (task 14), which rewrites the guide and stack catalogs.
const CATALOG_MODULES = ["src/catalog/catalog.ts", "src/catalog/validation.ts", "src/guides/catalog.ts"];

// Removed by `add-test-impact-map` (task 16), which reworks the repo-map search.
const REPO_MAP_MODULES = ["src/core/repo-map/search.ts"];

// Unresolved after `restructure-code` (task 07); `release-v2` (task 17) must split each one or record a new decision.
const UNRESOLVED_SOURCE_FILES = ["src/cli-program.ts", "src/core/context/context.ts", "src/utils/file-lock.ts"];

const OVERSIZED_SOURCE_FILES = [...CATALOG_MODULES, "src/cli-program.ts", "src/utils/file-lock.ts"];

const COMPLEX_SOURCE_FILES = ["src/catalog/validation.ts", ...REPO_MAP_MODULES, ...UNRESOLVED_SOURCE_FILES];

// Removed by `release-v2` (task 17), which reviews the release scripts.
const RELEASE_SCRIPT_EXEMPTIONS = ["scripts/scan-release.mjs", "scripts/version-sync.mjs"];

export default tseslint.config(
  {
    // docs/** may contain untracked, user-owned third-party material (e.g. vendored skill
    // bundles) that is not part of the Harnix package and is never linted as product code.
    ignores: ["dist/**", "node_modules/**", ".artifacts/**", "docs/**", ".kilo/**", ".worktrees/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        URL: "readonly",
        process: "readonly",
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      complexity: ["error", 20],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      // Imports that leave the current directory use the `src/...` and `test/...` aliases (tsconfig paths).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["../*"], message: "Use the src/... or test/... alias instead of a parent-relative path." },
          ],
        },
      ],
    },
  },
  {
    // Plain Node scripts and config files are outside tsconfig, so they get no type information.
    files: ["scripts/**/*.mjs", "eslint.config.mjs", ".pnpmfile.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Tests inject async fakes, spy on unbound methods and read untyped JSON on purpose. Unresolved after
    // `standardize-tests` (task 08); `release-v2` (task 17) must remove this block or record a new decision.
    // Test files are capped at 400 lines (enforced by test/unit/test-structure.test.ts), not 300.
    files: ["test/**/*.ts"],
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
  { files: OVERSIZED_SOURCE_FILES, rules: { "max-lines": "off" } },
  { files: COMPLEX_SOURCE_FILES, rules: { complexity: "off" } },
  { files: RELEASE_SCRIPT_EXEMPTIONS, rules: { complexity: "off", "max-lines": "off" } },
  prettier,
);
