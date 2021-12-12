"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prefer_promise_rejection_1 = require("./rules/prefer-promise-rejection");
module.exports = {
    rules: {
        'prefer-promise-rejection': prefer_promise_rejection_1.default
    },
    configs: {
        recommended: {
            plugins: ['chamion-typescript'],
            rules: {
                'chamion-typescript/prefer-promise-rejection': 'error'
            }
        }
    }
};
