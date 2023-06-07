const isUseState = (expression) =>
  isIdentifier("useState")(expression) ||
  (expression.type === "MemberExpression" &&
    isIdentifier("React")(expression.object) &&
    isIdentifier("useState")(expression.property));

const isIdentifier = (name) => (expression) =>
  expression.type === "Identifier" && expression.name === name;

const isUseStateCall = (expression) =>
  expression.type === "CallExpression" && isUseState(expression.callee);

const isArrayPatternIndex = (index) => (identifier) =>
  identifier.parent != null &&
  identifier.parent.type === "ArrayPattern" &&
  identifier.parent.elements[index] === identifier;

const stateReferences = (references) =>
  references.filter((reference) => {
    return (
      reference.init &&
      isArrayPatternIndex(0)(reference.identifier) &&
      reference.writeExpr != null &&
      isUseStateCall(reference.writeExpr)
    );
  });

const setStateReferences = (references) =>
  references.filter((reference) => {
    return (
      reference.init &&
      isArrayPatternIndex(1)(reference.identifier) &&
      reference.writeExpr != null &&
      isUseStateCall(reference.writeExpr)
    );
  });

const identifierReferences = (identifier, scopes) =>
  scopes
    .flatMap((scope) => scope.references)
    .filter(
      (reference) =>
        reference.resolved &&
        reference.resolved.defs.some((def) => def.name === identifier)
    );

const rangeEquals = (a, b) =>
  a.range[0] === b.range[0] && a.range[1] === b.range[1];
const referenceIs = (node) => (reference) =>
  rangeEquals(reference.identifier, node);
const isInRange = (range) => (node) =>
  node.range[0] >= range[0] && node.range[1] <= range[1];

const create = (context) => {
  const { scopeManager } = context.getSourceCode();
  const states = scopeManager.scopes.flatMap((scope) =>
    stateReferences(scope.references)
  );
  const setStates = scopeManager.scopes.flatMap((scope) =>
    setStateReferences(scope.references)
  );
  const stateHooks = states
    .map((state) => {
      const setStateReference = setStates.find(
        (setState) => setState.writeExpr === state.writeExpr
      );
      return {
        state: state.identifier,
        setState:
          setStateReference != null ? setStateReference.identifier : null,
      };
    })
    .filter((hook) => hook.setState != null)
    .map((hook) => ({
      ...hook,
      stateReferences: identifierReferences(hook.state, scopeManager.scopes),
      setStateReferences: identifierReferences(
        hook.setState,
        scopeManager.scopes
      ),
    }));
  return {
    CallExpression: (node) => {
      const stateHook = stateHooks.find((hook) =>
        hook.setStateReferences.some(referenceIs(node.callee))
      );
      if (stateHook == null || node.arguments.length === 0) return;
      const range = [
        node.arguments[0].range[0],
        node.arguments[node.arguments.length - 1].range[1],
      ];
      if (
        !stateHook.stateReferences.some((reference) =>
          isInRange(range)(reference.identifier)
        )
      )
        return;
      context.report({
        node,
        message: "Set state argument refers to possibly stale state",
      });
    },
  };
};

const meta = {
  type: "problem",
  docs: {
    description: "Disallow referring to state in arguments of setState",
    recommended: "error",
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
