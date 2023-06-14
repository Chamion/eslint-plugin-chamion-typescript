"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isHook = (name) => (expression) => isIdentifier(name)(expression) ||
    (expression.type === "MemberExpression" &&
        isIdentifier("React")(expression.object) &&
        isIdentifier(name)(expression.property));
const isStateHook = (expression) => isHook("useState")(expression) || isHook("useReducer")(expression);
const isIdentifier = (name) => (expression) => expression.type === "Identifier" && expression.name === name;
const isStateHookCall = (expression) => expression.type === "CallExpression" && isStateHook(expression.callee);
const isArrayPatternIndex = (index) => (identifier) => identifier.parent != null &&
    identifier.parent.type === "ArrayPattern" &&
    identifier.parent.elements[index] === identifier;
const rangeEquals = (a, b) => a.range[0] === b.range[0] && a.range[1] === b.range[1];
const referenceIs = (node) => (reference) => rangeEquals(reference.identifier, node);
const isInRange = (range) => (node) => node.range[0] >= range[0] && node.range[1] <= range[1];
const hasSameRange = (a, b) => a.range[0] === b.range[0] && a.range[1] === b.range[1];
const getNearestParentCall = (scopeNode) => {
    if (scopeNode.type === "CallExpression")
        return scopeNode;
    else if (scopeNode.parent == null)
        return null;
    else
        return getNearestParentCall(scopeNode.parent);
};
const collectUseEffects = (scope) => scope.references
    .filter((reference) => isIdentifier("useEffect")(reference.identifier) ||
    (isIdentifier("React")(reference.identifier) &&
        isHook("useEffect")(reference.identifier.parent)))
    .flatMap((reference) => {
    const call = getNearestParentCall(reference.identifier);
    return call == null ? [] : [call];
});
const collectDispatches = (scope) => scope.variables.filter((variable) => variable.defs.length === 1 &&
    variable.defs[0].node.init &&
    isStateHookCall(variable.defs[0].node.init) &&
    isArrayPatternIndex(1)(variable.defs[0].name));
function create(context) {
    const { scopeManager: { scopes }, } = context.getSourceCode();
    const visit = (node) => {
        const { body } = node;
        if (body.type !== "BlockStatement")
            return;
        const scope = scopes.find((scope) => hasSameRange(node, scope.block));
        if (scope == null)
            return;
        const useEffects = collectUseEffects(scope);
        if (useEffects.length === 0)
            return;
        const dispatches = collectDispatches(scope);
        const dispatchCalls = scope.childScopes
            .flatMap((childScope) => childScope.references.filter((reference) => dispatches
            .flatMap((dispatch) => dispatch.identifiers)
            .includes(reference.resolved &&
            reference.resolved.defs.length > 0 &&
            reference.resolved.defs[0].name)))
            .filter((reference) => reference.identifier.parent.type === "CallExpression")
            .map((reference) => reference.identifier.parent);
        if (dispatchCalls.length === 0)
            return;
        const useEffectBodyRanges = useEffects
            .filter((call) => call.arguments.length > 0)
            .map((call) => call.arguments[0].range);
        const violations = dispatchCalls.filter((dispatchCall) => useEffectBodyRanges.some((range) => isInRange(range)(dispatchCall)));
        violations.forEach((violation) => void context.report({
            node: violation.callee,
            message: "Dispatch call in useEffect callback may cause unnecessary rerenders",
        }));
    };
    return {
        FunctionDeclaration: visit,
        FunctionExpression: visit,
        ArrowFunctionExpression: visit,
    };
}
const meta = {
    type: "problem",
    docs: {
        description: "Disallow dispatching state changes from useEffect callbacks",
        recommended: false,
        extendsBaseRule: false,
        requiresTypeChecking: false,
    },
    hasSuggestions: false,
    schema: [],
};
exports.default = {
    meta,
    create,
};
