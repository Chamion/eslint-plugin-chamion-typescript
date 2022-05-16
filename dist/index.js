"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prefer_promise_rejection_1 = require("./rules/prefer-promise-rejection");
const explicit_void_return_1 = require("./rules/explicit-void-return");
module.exports = {
    rules: {
        "prefer-promise-rejection": prefer_promise_rejection_1.default,
        "explicit-void-return": explicit_void_return_1.default,
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
