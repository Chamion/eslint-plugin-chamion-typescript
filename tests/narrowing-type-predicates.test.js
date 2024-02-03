import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../src/rules/narrowing-type-predicates";
import path from "path";

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
    tsconfigRootDir: path.join(__dirname, "fixture"),
    sourceType: "module",
  },
});

ruleTester.run("narrowing-type-predicates", rule, {
  valid: [
    `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A';
    `,
  ],
  invalid: [],
});
