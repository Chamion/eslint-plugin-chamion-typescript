import preferPromiseRejection from "./rules/prefer-promise-rejection";
import explicitVoidReturn from "./rules/explicit-void-return";
import noReturnIntoVoid from "./rules/no-return-into-void";
import noUniqueObjectComparison from "./rules/no-unique-object-comparison";
// @ts-expect-error
import compoundAssignment from "./rules/compound-assignment";
// @ts-expect-error
import incrementAssignment from "./rules/increment-assignment";
// @ts-expect-error
import noAssignmentExpression from "./rules/no-assignment-expression";
// @ts-expect-error
import preferNumberIsnan from "./rules/prefer-number-isnan";
// @ts-expect-error
import voidArrowBody from "./rules/void-arrow-body";
// @ts-expect-error
import voidSideEffect from "./rules/void-side-effect";

module.exports = {
  rules: {
    "prefer-promise-rejection": preferPromiseRejection,
    "explicit-void-return": explicitVoidReturn,
    "no-return-into-void": noReturnIntoVoid,
    "no-unique-object-comparison": noUniqueObjectComparison,
    "compound-assignment": compoundAssignment,
    "increment-assignment": incrementAssignment,
    "no-assignment-expression": noAssignmentExpression,
    "prefer-number-isnan": preferNumberIsnan,
    "void-arrow-body": voidArrowBody,
    "void-side-effect": voidSideEffect
  },
  configs: {
    recommended: {
      plugins: ["chamion-typescript"],
      rules: {
        "chamion-typescript/prefer-promise-rejection": "error",
        "chamion-typescript/no-return-into-void": "error",
        "chamion-typescript/no-unique-object-comparison": "error",
        "chamion-typescript/prefer-number-isnan": "error",
        "chamion-typescript/void-side-effect": "error"
      },
    },
  },
};
