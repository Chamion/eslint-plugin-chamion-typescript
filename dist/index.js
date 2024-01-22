"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prefer_promise_rejection_1 = require("./rules/prefer-promise-rejection");
const explicit_void_return_1 = require("./rules/explicit-void-return");
const no_return_into_void_1 = require("./rules/no-return-into-void");
const no_unique_object_comparison_1 = require("./rules/no-unique-object-comparison");
const compound_assignment_1 = require("./rules/compound-assignment");
const increment_assignment_1 = require("./rules/increment-assignment");
const no_assignment_expression_1 = require("./rules/no-assignment-expression");
const prefer_number_isnan_1 = require("./rules/prefer-number-isnan");
const void_arrow_body_1 = require("./rules/void-arrow-body");
const void_side_effect_1 = require("./rules/void-side-effect");
const prefer_flatmap_1 = require("./rules/prefer-flatmap");
const react_no_stale_state_1 = require("./rules/react-no-stale-state");
const react_no_unnecessary_rerender_1 = require("./rules/react-no-unnecessary-rerender");
module.exports = {
    rules: {
        "prefer-promise-rejection": prefer_promise_rejection_1.default,
        "explicit-void-return": explicit_void_return_1.default,
        "no-return-into-void": no_return_into_void_1.default,
        "no-unique-object-comparison": no_unique_object_comparison_1.default,
        "compound-assignment": compound_assignment_1.default,
        "increment-assignment": increment_assignment_1.default,
        "no-assignment-expression": no_assignment_expression_1.default,
        "prefer-number-isnan": prefer_number_isnan_1.default,
        "void-arrow-body": void_arrow_body_1.default,
        "void-side-effect": void_side_effect_1.default,
        "prefer-flatmap": prefer_flatmap_1.default,
        "react-no-stale-state": react_no_stale_state_1.default,
        "react-no-unnecessary-rerender": react_no_unnecessary_rerender_1.default,
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
