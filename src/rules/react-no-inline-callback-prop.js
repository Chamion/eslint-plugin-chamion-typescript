const rangeEquals = (a, b) =>
  a.range[0] === b.range[0] && a.range[1] === b.range[1];
const referenceIs = (node) => (reference) =>
  rangeEquals(reference.identifier, node);
const isInRange = (range) => (node) =>
  node.range[0] >= range[0] && node.range[1] <= range[1];

const isCallbackDeclarator = (node) =>
  node.type === "VariableDeclarator" &&
  node.init != null &&
  (node.init.type === "ArrowFunctionExpression" ||
    node.init.type === "FunctionExpression");

function create(context) {
  const { scopeManager } = context.getSourceCode();
  const callbacksInComponentsOrHooks = [];
  const visitComponentOrHook = (node) => {
    const { body } = node;
    if (body == null || body.type !== "BlockStatement") return;
    const scope = scopeManager.acquire(node);
    const callbackVariables = scope.variables.filter(
      ({ defs }) =>
        defs.length > 0 &&
        defs[0].type === "Variable" &&
        defs[0].node != null &&
        isCallbackDeclarator(defs[0].node)
    );
    callbacksInComponentsOrHooks.push(...callbackVariables);
  };
  return {
    FunctionDeclaration: (node) => {
      const { id } = node;
      if (
        id == null ||
        id.type !== "Identifier" ||
        !/^([A-Z]|use)/.test(id.name)
      )
        return;
      visitComponentOrHook(node);
    },
    VariableDeclarator: (node) => {
      const { id, init } = node;
      if (
        id == null ||
        id.type !== "Identifier" ||
        !/^([A-Z]|use)/.test(id.name) ||
        init == null ||
        !(
          init.type === "ArrowFunctionExpression" ||
          init.type === "FunctionExpression"
        )
      )
        return;
      visitComponentOrHook(init);
    },
    JSXOpeningElement: (node) => {
      const { name, attributes } = node;
      if (
        name == null ||
        name.type !== "JSXIdentifier" ||
        !/^[A-Z]/.test(name.name)
      )
        return;
      const attributeExpressions = attributes
        .map(({ value }) => value)
        .filter(
          (value) => value != null && value.type === "JSXExpressionContainer"
        )
        .map(({ expression }) => expression);
      attributeExpressions
        .filter(
          ({ type }) =>
            type === "ArrowFunctionExpression" || type === "FunctionExpression"
        )
        .forEach((expression) => {
          context.report({
            node: expression,
            message:
              "Inline callback expression has a unique identity on each render. Wrap it in useCallback.",
          });
        });
      attributeExpressions
        .filter(({ type }) => type === "Identifier")
        .forEach((expression) => {
          const identifiedVariable = callbacksInComponentsOrHooks
            .filter((variable) =>
              isInRange(variable.scope.block.range)(expression)
            )
            .find(
              (variable) =>
                variable.identifiers.length > 0 &&
                variable.identifiers[0].name === expression.name
            );
          if (identifiedVariable == null) return;
          context.report({
            node: expression,
            message:
              "Inline callback expression has a unique identity on each render. Wrap it in useCallback.",
          });
        });
    },
  };
}

const meta = {
  type: "problem",
  docs: {
    description: "Disallow passing inline callbacks as component props",
    recommended: false,
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
