"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prefer_promise_rejection_1 = require("./rules/prefer-promise-rejection");
const explicit_void_return_1 = require("./rules/explicit-void-return");
const no_return_into_void_1 = require("./rules/no-return-into-void");
const no_unique_object_comparison_1 = require("./rules/no-unique-object-comparison");
module.exports = {
    rules: {
        "prefer-promise-rejection": prefer_promise_rejection_1.default,
        "explicit-void-return": explicit_void_return_1.default,
        "no-return-into-void": no_return_into_void_1.default,
        "no-unique-object-comparison": no_unique_object_comparison_1.default,
    },
    configs: {
        recommended: {
            plugins: ["chamion-typescript"],
            rules: {
                "chamion-typescript/prefer-promise-rejection": "error",
                "chamion-typescript/no-return-into-void": "error",
                "chamion-typescript/no-unique-object-comparison": "error",
            },
        },
    },
};
