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
    `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A', true)
  : (value satisfies Exclude<'A' | 'B', 'A'>, false);
    `,
  ],
  invalid: [
    {
      code: `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A' | 'B', true)
  : (value satisfies Exclude<'A' | 'B', 'A'>, false);
      `,
      output: `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A', true)
  : (value satisfies Exclude<'A' | 'B', 'A'>, false);
      `,
      errors: [{ messageId: "return" }],
    },
    {
      code: `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A', true)
  : (value satisfies Exclude<'B', 'A'>, false);
      `,
      output: `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A', true)
  : (value satisfies Exclude<'A' | 'B', 'A'>, false);
      `,
      errors: [{ messageId: "param" }],
    },
    {
      code: `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A', true)
  : (value satisfies Exclude<'A' | 'B', 'A' & 'B'>, false);
      `,
      output: `
const predicate = (value: 'A' | 'B'): value is 'A' => value === 'A'
  ? (value satisfies 'A', true)
  : (value satisfies Exclude<'A' | 'B', 'A'>, false);
      `,
      errors: [{ messageId: "return" }],
    },
    {
      code: `
const predicate = (value: number): value is 0 => {
  return (value satisfies 1, true);
  return (value satisfies Exclude<number, 1>, false);
};
      `,
      output: `
const predicate = (value: number): value is 0 => {
  return (value satisfies 0, true);
  return (value satisfies Exclude<number, 0>, false);
};
      `,
      errors: [{ messageId: "return" }, { messageId: "return" }],
    },
    {
      code: `
const predicate = (value: A): value is B => {
  switch (value.type) {
    case 'Identifier':
    case 'ThisExpression':
      return (value satisfies C, true);
    default:
      return (value satisfies Exclude<B, C>, false);
  }
};
      `,
      output: `
const predicate = (value: A): value is B => {
  switch (value.type) {
    case 'Identifier':
    case 'ThisExpression':
      return (value satisfies B, true);
    default:
      return (value satisfies Exclude<A, B>, false);
  }
};
      `,
      errors: [
        { messageId: "return" },
        { messageId: "param" },
        { messageId: "return" },
      ],
    },
  ],
});
