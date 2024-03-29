"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmptyArray = (expression) => expression.type === "ArrayExpression" && expression.elements.length === 0;
const isLambda = (expression) => expression.type === "ArrowFunctionExpression" ||
    expression.type === "FunctionExpression";
const isReduceCall = (callExpression) => {
    // TODO: find Array.prototype.reduce usage as well.
    // TODO: detect list['reduce'] usage as well.
    const { callee } = callExpression;
    if (callee.type !== "MemberExpression")
        return false;
    const { property } = callee;
    return property.type === "Identifier" && property.name === "reduce";
};
const getFunctionReturnValues = (arrowFunctionExpression) => {
    switch (arrowFunctionExpression.body.type) {
        case "BlockStatement":
            return getReturnStatements(arrowFunctionExpression.body).flatMap(getReturnValues);
        case "ConditionalExpression":
            return getConditionalExpressionBranches(arrowFunctionExpression.body);
        default:
            return [arrowFunctionExpression.body];
    }
};
const getReturnStatements = (statement) => {
    switch (statement.type) {
        case "ReturnStatement":
            return [statement];
        case "BlockStatement":
            return statement.body.flatMap(getReturnStatements);
        case "IfStatement":
            return [statement.consequent, statement.alternate]
                .filter((s) => s != null)
                .flatMap(getReturnStatements);
        case "LabeledStatement":
            return getReturnStatements(statement.body);
        default:
            return [];
    }
};
const getConditionalExpressionBranches = (conditionalExpression) => {
    const consequentBranches = conditionalExpression.consequent.type === "ConditionalExpression"
        ? getConditionalExpressionBranches(conditionalExpression.consequent)
        : [conditionalExpression.consequent];
    const alternateBranches = conditionalExpression.alternate.type === "ConditionalExpression"
        ? getConditionalExpressionBranches(conditionalExpression.alternate)
        : [conditionalExpression.alternate];
    return [...consequentBranches, ...alternateBranches];
};
const getReturnValues = (returnStatement) => {
    if (returnStatement.argument == null)
        return [];
    switch (returnStatement.argument.type) {
        case "ConditionalExpression":
            return getConditionalExpressionBranches(returnStatement.argument);
        case "SequenceExpression":
            return returnStatement.argument.expressions[returnStatement.argument.expressions.length - 1];
        default:
            return [returnStatement.argument];
    }
};
const isDerivativeArray = (name) => (expression) => {
    if (expression.type !== "ArrayExpression" ||
        expression.elements.length < 2 ||
        expression.elements[0].type !== "SpreadElement")
        return false;
    return (expression.elements[0].argument.type === "Identifier" &&
        expression.elements[0].argument.name === name);
};
const isIdentifierOrDerivativeArray = (name) => (expression) => isDerivativeArray(name)(expression) ||
    (expression.type === "Identifier" && expression.name === name);
const fixReturnValue = (accName, fixer, source) => (expression) => {
    switch (expression.type) {
        case "ArrayExpression":
            return [
                fixer.replaceText(expression, [
                    "[",
                    ...expression.elements
                        .slice(1)
                        .map((element) => source.getText(element)),
                    "]",
                ].join("")),
            ];
        case "Identifier":
            return [fixer.replaceText(expression, "[]")];
        default:
            return [];
    }
};
const create = (context) => {
    return {
        CallExpression(node) {
            if (!isReduceCall(node))
                return;
            const [fold, initialValue] = node.arguments;
            if (fold == null ||
                initialValue == null ||
                !isEmptyArray(initialValue) ||
                !isLambda(fold))
                return;
            const [acc, curr] = fold.params;
            if (acc == null ||
                acc.type !== "Identifier" ||
                curr == null ||
                curr.type !== "Identifier")
                return;
            const returnValues = getFunctionReturnValues(fold);
            if (returnValues.length < 2 ||
                !returnValues.every(isIdentifierOrDerivativeArray(acc.name)) ||
                !returnValues.some(isDerivativeArray(acc.name)))
                return;
            const fix = (fixer) => [
                fixer.removeRange([acc.range[0], curr.range[0]]),
                fixer.replaceText(node.callee.property, "flatMap"),
                ...returnValues.flatMap(fixReturnValue(acc.name, fixer, context.getSourceCode())),
                // Remove up to end of arguments because there may be a trailing comma
                fixer.removeRange([initialValue.range[0], node.range[1] - 1]),
            ];
            context.report({
                node,
                message: "This expression can be better expressed with Array.prototype.flatMap",
                suggest: [
                    {
                        desc: "Use flatMap instead of reduce",
                        fix,
                    },
                ],
            });
        },
    };
};
const meta = {
    type: "suggestion",
    docs: {
        description: "Prefer Array.prototype.flatMap over Array.prototype.reduce where applicable",
        recommended: "error",
        extendsBaseRule: false,
        requiresTypeChecking: false,
    },
    hasSuggestions: true,
    schema: [],
};
exports.default = {
    meta,
    create,
};
