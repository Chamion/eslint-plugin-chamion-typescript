"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const tsutils_1 = require("tsutils");
const { getParserServices } = experimental_utils_1.ESLintUtils;
const createRule = experimental_utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`);
// Copy-pasted from no-unsafe-return
const getParentFunctionNode = (node) => {
    let current = node.parent;
    while (current) {
        if (current.type === experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression ||
            current.type === experimental_utils_1.AST_NODE_TYPES.FunctionDeclaration ||
            current.type === experimental_utils_1.AST_NODE_TYPES.FunctionExpression) {
            return current;
        }
        current = current.parent;
    }
    // this shouldn't happen in correct code, but someone may attempt to parse bad code
    // the parser won't error, so we shouldn't throw here
    /* istanbul ignore next */ return null;
};
exports.default = createRule({
    name: "prefer-promise-rejection",
    meta: {
        type: "problem",
        docs: {
            description: "Disallow throwing in a function that always returns a promise",
            recommended: false,
            extendsBaseRule: false,
            requiresTypeChecking: true,
        },
        hasSuggestions: false,
        messages: {
            throw: "Unexpected throw statement in a function that returns promise. Did you mean to return a rejecting promise instead?",
        },
        schema: [],
    },
    defaultOptions: [],
    create: (context) => {
        const parserServices = getParserServices(context, true);
        const checker = parserServices.program.getTypeChecker();
        const getReturnTypeUnionSubTypes = (type) => (0, tsutils_1.unionTypeParts)(type)
            .flatMap((subType) => subType.getCallSignatures())
            .map((signature) => signature.getReturnType())
            .flatMap((returnType) => (0, tsutils_1.unionTypeParts)(returnType));
        return {
            ThrowStatement: (node) => {
                const parent = getParentFunctionNode(node);
                if (parent == null || parent.async) {
                    return;
                }
                const parentType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(parent)));
                const returnTypes = getReturnTypeUnionSubTypes(parentType);
                const returnsPromise = returnTypes.every((returnType) => { var _a; return ((_a = returnType.getSymbol()) === null || _a === void 0 ? void 0 : _a.name) === "Promise"; });
                if (returnsPromise) {
                    context.report({
                        node,
                        messageId: "throw",
                    });
                }
            },
        };
    },
});
