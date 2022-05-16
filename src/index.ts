import preferPromiseRejection from "./rules/prefer-promise-rejection";
import explicitVoidReturn from "./rules/explicit-void-return";
import noReturnIntoVoid from "./rules/no-return-into-void";

module.exports = {
  rules: {
    "prefer-promise-rejection": preferPromiseRejection,
    "explicit-void-return": explicitVoidReturn,
    "no-return-into-void": noReturnIntoVoid,
  },
  configs: {
    recommended: {
      plugins: ["chamion-typescript"],
      rules: {
        "chamion-typescript/prefer-promise-rejection": "error",
        "chamion-typescript/no-return-into-void": "error",
      },
    },
  },
};
