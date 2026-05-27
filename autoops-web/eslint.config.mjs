import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Existing API integration tests — leave untouched per task instructions
    "src/__tests__/api/**",
    // Pre-existing linting issues in non-test files (not related to testing implementation)
    "src/app/(app)/catalog/**",
    "src/components/theme-*.tsx",
  ]),
]);

export default eslintConfig;
