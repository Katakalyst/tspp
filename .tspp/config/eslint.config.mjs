import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const forbiddenTypeNames = [
  "Array",
  "Boolean",
  "CallableFunction",
  "Function",
  "IArguments",
  "NewableFunction",
  "Number",
  "Object",
  "RegExp",
  "String",
];
const tsppGlobals = {
  Err: "readonly",
  None: "readonly",
  Ok: "readonly",
  Some: "readonly",
  float64: "readonly",
  i8: "readonly",
  i16: "readonly",
  i32: "readonly",
  i64: "readonly",
  isErr: "readonly",
  isNone: "readonly",
  isOk: "readonly",
  isSome: "readonly",
  u8: "readonly",
  u16: "readonly",
  u32: "readonly",
  u64: "readonly",
};

export default defineConfig(
  {
    ignores: ["dist/**", ".tspp/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["index.ts", "src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: tsppGlobals,
      sourceType: "module",
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "undefined",
          message: "undefined is not part of tspp. Use None instead.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...forbiddenTypeNames.map((name) => ({
          selector: `TSTypeReference Identifier[name='${name}']`,
          message: `${name} is compiler scaffolding only and is not part of tspp.`,
        })),
        ...forbiddenTypeNames.map((name) => ({
          selector: `TSExpressionWithTypeArguments Identifier[name='${name}']`,
          message: `${name} is compiler scaffolding only and is not part of tspp.`,
        })),
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
        {
          selector: "Literal[value=null]",
          message: "null is not part of tspp. Use None instead.",
        },
        {
          selector: "NewExpression",
          message:
            "new is not part of tspp. Use functions or wrappers instead.",
        },
        {
          selector: "ThisExpression",
          message: "this is not part of tspp.",
        },
        {
          selector: "ForInStatement",
          message:
            "for..in is not part of tspp. Iterate explicit values instead.",
        },
        {
          selector: "ForStatement",
          message:
            "C-style for loops are not part of tspp. Use range-based iteration instead.",
        },
        {
          selector: "WhileStatement",
          message:
            "while loops are not part of tspp. Use iterator-driven control flow instead.",
        },
        {
          selector: "DoWhileStatement",
          message:
            "do..while loops are not part of tspp. Use iterator-driven control flow instead.",
        },
        {
          selector: "UpdateExpression",
          message:
            "++ and -- are not part of tspp. Use explicit values instead.",
        },
        {
          selector: "ThrowStatement",
          message: "throw is not part of tspp. Use Result instead.",
        },
        {
          selector: "TryStatement",
          message: "try/catch is not part of tspp. Use Result instead.",
        },
      ],
    },
  },
);
