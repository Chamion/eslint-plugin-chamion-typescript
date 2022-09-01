const createSideEffect = (context) => {
  let allowTraps = !!context.options[0] && context.options[0].allowTraps;
  if (!allowTraps) {
    allowTraps = {};
  } else if (allowTraps === true) {
    allowTraps = {
      get: true,
      has: true,
      ownKeys: true,
    };
  }
  const hasSideEffect = (node) => {
    switch (node.type) {
      case "UpdateExpression":
      case "AssignmentExpression":
      case "CallExpression":
      case "OptionalCallExpression":
      case "NewExpression":
      case "YieldExpression":
      case "AwaitExpression":
        return true;
      case "MemberExpression":
        if (allowTraps.get) return true;
        return hasSideEffect(node.object);
      case "UnaryExpression":
        if (node.operator === "delete") return true;
      case "SpreadElement":
        return hasSideEffect(node.argument);
      case "BinaryExpression":
        if (allowTraps.has && node.operator === "in") return true;
      case "LogicalExpression":
        return hasSideEffect(node.left) || hasSideEffect(node.right);
      case "SequenceExpression":
        return node.expressions.some(hasSideEffect);
      case "ArrayExpression":
        return node.elements.some(hasSideEffect);
      case "ConditionalExpression":
        return (
          hasSideEffect(node.consequent) || hasSideEffect(node.alternative)
        );
      case "ObjectExpression":
        return node.properties.some((property) =>
          property.type === "Property"
            ? hasSideEffect(property.value) || hasSideEffect(property.key)
            : // TODO: define exact type name(s) of spread operator
              allowTraps.ownKeys ||
              (!!property.argument && hasSideEffect(property.argument))
        );
      case "TemplateLiteral":
        return node.expressions.some(hasSideEffect);
      case "TaggedTemplateExpression":
        return hasSideEffect(node.quasi);
      case "ChainExpression":
        return hasSideEffect(node.expression);
      default:
        return false;
    }
  };
  return {
    UnaryExpression(node) {
      if (node.operator !== "void" || hasSideEffect(node.argument)) return;
      const fix = (fixer) => fixer.replaceText(node, "undefined");
      context.report({
        node,
        message:
          "Unexpected void operator on non-side-effect argument. Use undefined instead.",
        fix,
        suggest: [
          {
            desc: "Replace with undefined.",
            fix,
          },
        ],
      });
    },
  };
};

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow void operator on non-side-effect arguments",
      suggestion: true,
      recommended: "error",
      extendsBaseRule: false,
      requiresTypeChecking: false,
    },
    hasSuggestions: true,
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allowTraps: {
            type: ["boolean", "object"],
            properties: {
              get: { type: "boolean" },
              has: { type: "boolean" },
              ownKeys: { type: "boolean" },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createSideEffect,
};
