import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: [".astro/**", "dist/**", "node_modules/**", ".github/**"],
  },

  // Apply Browser & Node globals project-wide
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Base ESLint & TypeScript Rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Vue 3 Configuration
  ...eslintPluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        // Tells the Vue parser to delegate to the TS parser for <script lang="ts">
        parser: tseslint.parser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/html-indent": "off",
      "vue/html-self-closing": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  },

  // Astro Configuration
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
  },

  // Global Custom Overrides
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
