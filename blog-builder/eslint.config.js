import jsdoc from "eslint-plugin-jsdoc";
import js from "@eslint/js";
import globals from "globals";

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
    files: ["**/*.js"],
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
];

export default config;
