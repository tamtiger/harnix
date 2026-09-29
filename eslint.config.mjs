import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/*
 * Temporary exemptions. Each list names the task that must delete it together with the code
 * change that makes it unnecessary; an entry may only be removed, never added, without a new
 * decision recorded in docs/OVERHAUL_DECISIONS.md.
 */

// Removed by `add-platform-registry` (task 12), which merges and splits the platform/doctor/global modules.
const PLATFORM_MODULES = [
  "src/commands/doctor.ts",
  "src/commands/global-doctor.ts",
  "src/commands/global-uninstall.ts",
  "src/commands/setup.ts",
  "src/utils/global-managed-files.ts",
];

// Removed by `add-verify-detection` (task 09), which reworks config and stack detection.
const VERIFY_DETECTION_MODULES = ["src/core/config/config.ts", "src/core/stack/detection.ts"];

// Removed by `rewrite-guides` (task 14), which rewrites the guide and stack catalogs.
const CATALOG_MODULES = ["src/catalog/catalog.ts", "src/catalog/validation.ts", "src/guides/catalog.ts"];

// Removed by `add-test-impact-map` (task 16), which reworks the repo-map search.
const REPO_MAP_MODULES = ["src/core/repo-map/search.ts"];

// Unresolved after `restructure-code` (task 07); `release-v2` (task 17) must split each one or record a new decision.
const UNRESOLVED_SOURCE_FILES = ["src/cli-program.ts", "src/core/context/context.ts", "src/utils/file-lock.ts"];

const OVERSIZED_SOURCE_FILES = [
  ...PLATFORM_MODULES,
  ...VERIFY_DETECTION_MODULES,
  ...CATALOG_MODULES,
  "src/cli-program.ts",
  "src/utils/file-lock.ts",
];

const COMPLEX_SOURCE_FILES = [
  "src/catalog/validation.ts",
  "src/commands/doctor.ts",
  "src/utils/global-managed-files.ts",
  ...REPO_MAP_MODULES,
  ...UNRESOLVED_SOURCE_FILES,
];

// Removed by `release-v2` (task 17), which reviews the release scripts.
const RELEASE_SCRIPT_EXEMPTIONS = ["scripts/scan-release.mjs", "scripts/version-sync.mjs"];

// Removed by `standardize-tests` (task 08), which splits large test files by module.
const OVERSIZED_TEST_FILES = [
  "test/integration/cli.test.ts",
  "test/integration/doctor.test.ts",
  "test/integration/global-lifecycle.test.ts",
  "test/integration/status.test.ts",
  "test/platform/setup.test.ts",
  "test/unit/activation-instructions.test.ts",
  "test/unit/context.test.ts",
  "test/unit/file-lock.test.ts",
  "test/unit/global-managed-files.test.ts",
  "test/unit/task-state.test.ts",
  "test/workflow/internal-context.test.ts",
  "test/workflow/internal-workflow.test.ts",
  "test/workflow/routing.test.ts",
  "test/workflow/task-contract-v3.test.ts",
];

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
    },
  },
  {
    // Plain Node scripts and config files are outside tsconfig, so they get no type information.
    files: ["scripts/**/*.mjs", "eslint.config.mjs", ".pnpmfile.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Tests inject async fakes, spy on unbound methods and read untyped JSON on purpose.
    // `standardize-tests` (task 08) replaces these with typed builders and removes this block.
    files: ["test/**/*.ts"],
    rules: {
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
  { files: OVERSIZED_TEST_FILES, rules: { "max-lines": "off" } },
  prettier,
);
