import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.vite/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: {
      globals: {
        AbortController: "readonly",
        Buffer: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        fetch: "readonly",
        performance: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        URL: "readonly"
      }
    }
  },
  {
    files: ["apps/web/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        document: "readonly",
        FileReader: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        URL: "readonly",
        window: "readonly"
      }
    }
  }
];
