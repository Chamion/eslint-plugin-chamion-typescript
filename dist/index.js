"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prefer_promise_rejection_1 = __importDefault(require("./rules/prefer-promise-rejection"));
exports.default = {
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
