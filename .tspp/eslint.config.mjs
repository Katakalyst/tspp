import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", ".tspp/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        Bun: "readonly",
      },
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "Math",
          message: "The global Math is not available here. Define your own Math if you want one.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ClassDeclaration",
          message: "Classes are not part of tspp.",
        },
        {
          selector: "ClassExpression",
          message: "Classes are not part of tspp.",
        },
        {
          selector: "TSEnumDeclaration",
          message: "Enums are not part of tspp.",
        },
      ],
    },
  },
);
