import preferPromiseRejection from "./rules/prefer-promise-rejection";
import explicitVoidReturn from "./rules/explicit-void-return";
import noReturnIntoVoid from "./rules/no-return-into-void";
import noUniqueObjectComparison from "./rules/no-unique-object-comparison";
import compoundAssignment from "./rules/compound-assignment";
import incrementAssignment from "./rules/increment-assignment";
import noAssignmentExpression from "./rules/no-assignment-expression";
import preferNumberIsnan from "./rules/prefer-number-isnan";
import voidArrowBody from "./rules/void-arrow-body";
import voidSideEffect from "./rules/void-side-effect";
import preferFlatmap from "./rules/prefer-flatmap";

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
    "void-side-effect": voidSideEffect,
    "prefer-flatmap": preferFlatmap,
  },
  configs: {
    recommended: {
      plugins: ["chamion-typescript"],
      rules: {
        "chamion-typescript/prefer-promise-rejection": "error",
        "chamion-typescript/no-return-into-void": "error",
        "chamion-typescript/no-unique-object-comparison": "error",
        "chamion-typescript/prefer-number-isnan": "error",
        "chamion-typescript/void-side-effect": "error",
        "chamion-typescript/prefer-flatmap": "error",
      },
    },
  },
};
