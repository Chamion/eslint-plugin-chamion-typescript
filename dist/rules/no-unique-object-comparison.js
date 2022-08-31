"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const tsutils_1 = require("tsutils");
const { getParserServices } = experimental_utils_1.ESLintUtils;
exports.createRule = experimental_utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`);
const isAlwaysUniqueObject = (node) => {
    switch (node.type) {
        case experimental_utils_1.AST_NODE_TYPES.ArrayExpression:
        case experimental_utils_1.AST_NODE_TYPES.ObjectExpression:
        case experimental_utils_1.AST_NODE_TYPES.NewExpression:
        case experimental_utils_1.AST_NODE_TYPES.FunctionExpression:
        case experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression:
            return true;
        case experimental_utils_1.AST_NODE_TYPES.Literal:
            return "regex" in node && node.regex != null;
        case experimental_utils_1.AST_NODE_TYPES.AssignmentExpression:
            return node.operator === "=" && isAlwaysUniqueObject(node.right);
        case experimental_utils_1.AST_NODE_TYPES.SequenceExpression: {
            const lastExpression = node.expressions[node.expressions.length - 1];
            return isAlwaysUniqueObject(lastExpression);
        }
        default:
            return false;
    }
};
const binaryExpressionComparesIdentity = (node) => ["===", "!=="].includes(node.operator);
const getMemberName = (node) => node.computed
    ? node.property.type === experimental_utils_1.AST_NODE_TYPES.Literal
        ? typeof node.property.value === "string"
            ? node.property.value
            : null
        : null
    : node.property.type === experimental_utils_1.AST_NODE_TYPES.Identifier
        ? node.property.name
        : null;
const isArrayType = (type) => {
    const union = (0, tsutils_1.unionTypeParts)(type);
    return union
        .map((unionPart) => unionPart.isIntersection() ? unionPart.types : [unionPart])
        .map((intersectionTypes) => intersectionTypes
        .map(({ intrinsicName }) => intrinsicName)
        .filter((name) => name != null))
        .every((intersectionTypeNames) => intersectionTypeNames.length === 0 ||
        intersectionTypeNames.some(RegExp.prototype.test.bind(/\[\]$/)));
};
const isArray = (node, context) => {
    switch (node.type) {
        case experimental_utils_1.AST_NODE_TYPES.ArrayExpression:
            return true;
        case experimental_utils_1.AST_NODE_TYPES.Identifier:
            return isArrayType(context.getNodeType(node));
        default:
            return false;
    }
};
const isArrayPrototypeIdentityCheckingMethod = (node) => {
    if (node.type !== experimental_utils_1.AST_NODE_TYPES.MemberExpression ||
        node.object.type !== experimental_utils_1.AST_NODE_TYPES.MemberExpression ||
        node.object.object.type !== experimental_utils_1.AST_NODE_TYPES.Identifier) {
        return false;
    }
    const level1Name = getMemberName(node);
    if (level1Name == null ||
        !["includes", "indexOf", "lastIndexOf"].includes(level1Name)) {
        return false;
    }
    const level2Name = getMemberName(node.object);
    if (level2Name !== "prototype") {
        return false;
    }
    const objectName = node.object.object.name;
    return objectName === "Array";
};
const isObjectPrototype = (node) => node.type === experimental_utils_1.AST_NODE_TYPES.Identifier && node.name === "Object";
const callExpressionComparesIdentityOfParameters = (node, context) => {
    const { callee } = node;
    if (callee.type !== experimental_utils_1.AST_NODE_TYPES.MemberExpression) {
        return [];
    }
    const memberName = getMemberName(callee);
    switch (memberName) {
        case "includes":
        case "indexOf":
        case "lastIndexOf":
            return isArray(callee.object, context) ? [true] : [];
        case "call":
        case "bind":
            return isArrayPrototypeIdentityCheckingMethod(callee.object)
                ? // eslint-disable-next-line no-sparse-arrays
                    [, true]
                : [];
        case "is":
            return isObjectPrototype(callee.object) ? [true, true] : [];
        default:
            return [];
    }
};
exports.default = (0, exports.createRule)({
    name: "no-unique-object-comparison",
    meta: {
        type: "problem",
        hasSuggestions: false,
        fixable: undefined,
        docs: {
            description: "Disallow comparing objects that cannot identity equal anything by identity",
            recommended: "error",
            extendsBaseRule: false,
            requiresTypeChecking: true,
        },
        messages: {
            comparison: "Object will always be unique; it cannot identity equal another",
        },
        schema: [],
    },
    defaultOptions: [],
    create: (context) => {
        const parserServices = getParserServices(context, true);
        const checker = parserServices.program.getTypeChecker();
        const getNodeType = (node) => checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(node)));
        const reportAlwaysUniqueObjects = (expressions) => expressions
            .filter(isAlwaysUniqueObject)
            .forEach((node) => void context.report({ node, messageId: "comparison" }));
        return {
            BinaryExpression: (node) => {
                if (!binaryExpressionComparesIdentity(node)) {
                    return;
                }
                const expressions = [node.left, node.right];
                reportAlwaysUniqueObjects(expressions);
            },
            CallExpression: (node) => {
                const parameterPositions = callExpressionComparesIdentityOfParameters(node, { getNodeType });
                const expressions = Object.keys(parameterPositions)
                    .map((index) => node.arguments[Number(index)])
                    .filter((argument) => argument != null);
                reportAlwaysUniqueObjects(expressions);
            },
            SwitchCase: (node) => {
                const expressions = [node.test].filter((expression) => expression != null);
                reportAlwaysUniqueObjects(expressions);
            },
        };
    },
});
