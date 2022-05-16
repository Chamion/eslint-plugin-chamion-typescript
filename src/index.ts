import preferPromiseRejection from "./rules/prefer-promise-rejection";
import explicitVoidReturn from "./rules/explicit-void-return";

module.exports = {
  rules: {
    "prefer-promise-rejection": preferPromiseRejection,
    "explicit-void-return": explicitVoidReturn,
  },
  configs: {
    recommended: {
      plugins: ["chamion-typescript"],
      rules: {
        "chamion-typescript/prefer-promise-rejection": "error",
      },
    },
  },
};
