import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // docs/** may contain untracked, user-owned third-party material (e.g. vendored skill
    // bundles) that is not part of the Harnix package and is never linted as product code.
    ignores: ["dist/**", "node_modules/**", ".artifacts/**", "docs/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        URL: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
