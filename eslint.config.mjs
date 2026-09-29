import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/*
 * Temporary exemptions. Each list names the task that must delete it together with the code
 * change that makes it unnecessary; an entry may only be removed, never added, without a new
 * decision recorded in docs/OVERHAUL_DECISIONS.md.
 */

// Removed by `restructure-code` (task 07), which splits these modules by responsibility.
const OVERSIZED_SOURCE_FILES = [
  "src/catalog/catalog.ts",
  "src/catalog/validation.ts",
  "src/cli-program.ts",
  "src/commands/doctor.ts",
  "src/commands/global-doctor.ts",
  "src/commands/global-uninstall.ts",
  "src/commands/internal-workflow.ts",
  "src/commands/setup.ts",
  "src/core/config/config.ts",
  "src/core/tasks/task.ts",
  "src/core/workflow.ts",
  "src/guides/catalog.ts",
  "src/utils/detection.ts",
  "src/utils/file-lock.ts",
  "src/utils/global-managed-files.ts",
];

// Removed by `restructure-code` (task 07) together with the oversized modules above.
const COMPLEX_SOURCE_FILES = [
  "src/catalog/validation.ts",
  "src/cli-program.ts",
  "src/commands/doctor.ts",
  "src/commands/internal-workflow.ts",
  "src/core/context/context.ts",
  "src/core/repo-map/search.ts",
  "src/core/tasks/task.ts",
  "src/utils/file-lock.ts",
  "src/utils/global-managed-files.ts",
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
