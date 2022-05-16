"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const tsutils_1 = require("tsutils");
const { getParserServices } = experimental_utils_1.ESLintUtils;
exports.createRule = experimental_utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`);
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
const voidTypeNames = ["undefined", "void"];
const isVoidType = (type) => {
    const { intrinsicName } = type;
    return intrinsicName != null && voidTypeNames.includes(intrinsicName);
};
const isUndefinedIdentifier = (expression) => expression.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
    expression.name === "undefined";
const isVoidExpression = (expression) => expression.type === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
    expression.operator === "void";
const isBlockStatement = (node) => node.type === experimental_utils_1.AST_NODE_TYPES.BlockStatement;
exports.default = (0, exports.createRule)({
    name: "explicit-void-return",
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow returning void implicitly.",
            recommended: false,
            suggestion: true,
            extendsBaseRule: false,
            requiresTypeChecking: true,
        },
        hasSuggestions: true,
        messages: {
            "body-return": "Return statements in a void function must return undefined or a void expression.",
            "arrow-body": "A void function must have a block body or return undefined or a void expression.",
            "suggestion-void": "Convert into a void expression",
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
            ReturnStatement: (node) => {
                const { argument } = node;
                if (argument == null ||
                    isUndefinedIdentifier(argument) ||
                    isVoidExpression(argument)) {
                    return;
                }
                const argumentType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(argument)));
                if (!isVoidType(argumentType)) {
                    return;
                }
                const parent = getParentFunctionNode(node);
                if (parent == null || parent.async) {
                    return;
                }
                const parentType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(parent)));
                const returnTypes = getReturnTypeUnionSubTypes(parentType);
                const returnsVoid = returnTypes.every(isVoidType);
                if (returnsVoid) {
                    context.report({
                        node: argument,
                        messageId: "body-return",
                        suggest: [
                            {
                                messageId: "suggestion-void",
                                fix: (fixer) => fixer.insertTextBefore(argument, "void "),
                            },
                        ],
                    });
                }
            },
            ArrowFunctionExpression: (node) => {
                if (isBlockStatement(node.body) ||
                    isUndefinedIdentifier(node.body) ||
                    isVoidExpression(node.body)) {
                    return;
                }
                const bodyType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(node.body)));
                if (!isVoidType(bodyType)) {
                    return;
                }
                const functionType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(node)));
                const returnTypes = getReturnTypeUnionSubTypes(functionType);
                const returnsVoid = returnTypes.every(isVoidType);
                if (returnsVoid) {
                    context.report({
                        node: node.body,
                        messageId: "arrow-body",
                        suggest: [
                            {
                                messageId: "suggestion-void",
                                fix: (fixer) => fixer.insertTextBefore(node.body, "void "),
                            },
                        ],
                    });
                }
            },
        };
    },
});
