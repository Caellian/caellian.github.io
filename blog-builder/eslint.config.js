import jsdoc from "eslint-plugin-jsdoc";
import js from "@eslint/js";
import globals from "globals";
import jest from "eslint-plugin-jest";

const config = [
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  jsdoc.configs["flat/recommended-typescript-flavor"],
  {
    files: ["src/**/*.js", "index.js"],
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/require-param-description": 0,
      "jsdoc/require-property-description": 0,
      "jsdoc/require-returns-description": 0,
      "jsdoc/no-defaults": 0,
    },
    settings: {
      jsdoc: {
        mode: "typescript",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    plugins: [jest],
    env: {
      "jest/globals": true,
    },
  },
];

export default config;
