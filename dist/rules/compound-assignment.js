"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identifierNodeEquals = (a, b) => a.type === "Identifier" && b.type === "Identifier" && a.name === b.name;
const COMPOUNDABLE_BINARY_OPERATORS = [
    "+",
    "-",
    "*",
    "/",
    "%",
    "**",
    "<<",
    ">>",
    ">>>",
    "&",
    "^",
    "|",
];
const isCompoundableOperator = Array.prototype.includes.bind(COMPOUNDABLE_BINARY_OPERATORS);
const SYMMETRICAL_BINARY_OPERATORS = ["*", "&", "^", "|"];
const isSymmetricalOperator = Array.prototype.includes.bind(SYMMETRICAL_BINARY_OPERATORS);
const binaryExpressionIdentifierPosition = (identifier, binaryExpression) => {
    if (identifierNodeEquals(identifier, binaryExpression.left))
        return "left";
    else if (isSymmetricalOperator(binaryExpression.operator) &&
        identifierNodeEquals(identifier, binaryExpression.right))
        return "right";
    else
        return null;
};
const createCompound = (context) => {
    const { prefer: preference } = context.options[0] || {};
    switch (preference) {
        case "verbose":
            return {
                AssignmentExpression: (node) => {
                    const { operator } = node;
                    if (operator === "=")
                        return;
                    const binaryOperator = operator.substring(0, operator.length - 1);
                    const canFix = isCompoundableOperator(binaryOperator);
                    const fix = canFix
                        ? (fixer) => {
                            const source = context.getSourceCode();
                            const leftText = source.getText(node.left);
                            const rightText = source.getText(node.right);
                            const binaryExpressionText = leftText + binaryOperator + rightText;
                            const assignmentText = leftText + "=" + binaryExpressionText;
                            return fixer.replaceText(node, assignmentText);
                        }
                        : undefined;
                    context.report({
                        node,
                        message: `Unexpected compound assignment operator.`,
                        fix,
                    });
                },
            };
        default:
            return {
                AssignmentExpression: (node) => {
                    const { operator } = node;
                    if (operator !== "=" || node.right.type !== "BinaryExpression")
                        return;
                    const binaryExpression = node.right;
                    const identifierPosition = binaryExpressionIdentifierPosition(node.left, binaryExpression);
                    if (!isCompoundableOperator(binaryExpression.operator) ||
                        identifierPosition == null)
                        return;
                    const fix = (fixer) => {
                        const source = context.getSourceCode();
                        const leftText = source.getText(node.left);
                        const rightText = source.getText(identifierPosition === "left"
                            ? binaryExpression.right
                            : binaryExpression.left);
                        const assignmentOperatorText = binaryExpression.operator + "=";
                        const assignmentText = leftText + assignmentOperatorText + rightText;
                        return fixer.replaceText(node, assignmentText);
                    };
                    context.report({
                        node,
                        message: `Assignment can be expressed with a compound operator.`,
                        fix,
                    });
                },
            };
    }
};
exports.default = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer compound or verbose assignment operators",
            recommended: false,
            extendsBaseRule: false,
            requiresTypeChecking: false,
        },
        hasSuggestions: false,
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    prefer: {
                        type: "string",
                        enum: ["compound", "verbose"],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [],
    create: createCompound,
};
