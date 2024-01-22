const isHook =
  (...names) =>
  (expression) =>
    isIdentifier(...names)(expression) ||
    (expression.type === "MemberExpression" &&
      isIdentifier("React")(expression.object) &&
      isIdentifier(...names)(expression.property));

const isIdentifier =
  (...names) =>
  (expression) =>
    expression.type === "Identifier" && names.includes(expression.name);

const rangeEquals = (a, b) =>
  a.range[0] === b.range[0] && a.range[1] === b.range[1];
const refersTo =
  (...nodes) =>
  (reference) =>
    reference.resolved != null &&
    reference.resolved.identifiers.some((resolved) =>
      nodes.some((node) => rangeEquals(resolved, node))
    );

const getImmediateExecutionPathScopes = (scope) => {
  const { childScopes } = scope;
  const immediateExecutionChildScopes = childScopes.filter(
    (scope) => scope.type === "block"
  );
  return [
    scope,
    ...immediateExecutionChildScopes.flatMap(getImmediateExecutionPathScopes),
  ];
};

const create = (context) => {
  const { scopeManager } = context.getSourceCode();
  const getReturnCallbacks = (functionNode) => {
    if (functionNode.body.type !== "BlockStatement")
      return ["ArrowFunctionExpression", "FunctionExpression"].includes(
        functionNode.body.type
      )
        ? [functionNode.body]
        : [];
    const immediateExecutionPath = getImmediateExecutionPathScopes(
      scopeManager.acquire(functionNode)
    );
    const functionChildScopes = immediateExecutionPath.flatMap((scope) =>
      scope.childScopes.filter((childScope) => childScope.type === "function")
    );
    return functionChildScopes
      .filter((scope) => scope.block.parent.type === "ReturnStatement")
      .map((scope) => scope.block);
  };
  const visit = (node) => {
    const scope = scopeManager.acquire(node);
    const getHookInvocations = (...names) =>
      scope.references.filter(
        (reference) =>
          isHook(...names)(reference.identifier) &&
          reference.identifier.parent &&
          reference.identifier.parent.type === "CallExpression"
      );

    const dispatches = getHookInvocations("useState", "useReducer")
      .map((reference) => reference.identifier.parent.parent)
      .filter(
        (maybeDeclarator) => maybeDeclarator.type === "VariableDeclarator"
      )
      .filter(
        ({ id }) =>
          id.type === "ArrayPattern" &&
          id.elements[1] != null &&
          id.elements[1].type === "Identifier"
      )
      .map(({ id }) => id.elements[1]);
    if (dispatches.length === 0) return;

    const useEffectCallbacks = getHookInvocations(
      "useEffect",
      "useLayoutEffect"
    )
      .map((reference) => reference.identifier.parent.arguments[0])
      .filter(
        (callback) =>
          callback != null &&
          ["ArrowFunctionExpression", "FunctionExpression"].includes(
            callback.type
          )
      );
    if (useEffectCallbacks.length === 0) return;
    [
      ...useEffectCallbacks,
      ...useEffectCallbacks.flatMap(getReturnCallbacks),
    ].forEach(visitCallback(dispatches, scope));
  };
  const visitCallback = (dispatches, parentScope) => (node) => {
    const scope = scopeManager.acquire(node);
    const immediateExecutionPath = getImmediateExecutionPathScopes(scope);
    const dispatchCalls = immediateExecutionPath
      .flatMap((executionScope) => executionScope.references)
      .filter(
        (reference) =>
          refersTo(...dispatches)(reference) &&
          reference.identifier.parent &&
          reference.identifier.parent.type === "CallExpression"
      )
      .map((reference) => reference.identifier.parent);
    dispatchCalls.forEach((call) =>
      context.report({
        node: call,
        message:
          "Unexpected state dispatch call in effect callback. Resolve the whole state transition in one rerender.",
      })
    );
  };
  return {
    FunctionExpression: visit,
    ArrowFunctionExpression: visit,
    FunctionDeclaration: visit,
  };
};

const meta = {
  type: "problem",
  docs: {
    description: "Disallow calling state dispatch functions effect callbacks",
    extendsBaseRule: false,
    requiresTypeChecking: false,
  },
  hasSuggestions: false,
  schema: [],
};

export default {
  meta,
  create,
};
