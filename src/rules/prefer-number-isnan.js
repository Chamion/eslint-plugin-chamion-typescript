const createPreferNumberIsnan = (context) => ({
  BinaryExpression: (node) => {
    if (
      node.left.type !== "Identifier" ||
      node.right.type !== "Identifier" ||
      node.left.name !== node.right.name
    )
      return;
    let complement;
    if (node.operator === "===" || node.operator === "==") {
      complement = true;
    } else if (node.operator === "!==" || node.operator === "!=") {
      complement = false;
    } else return;
    const source = context.getSourceCode();
    const commentsInside = source.getCommentsInside(node);
    const fix =
      commentsInside.length > 0
        ? undefined
        : (fixer) =>
            fixer.replaceText(
              node,
              `${complement ? "!" : ""}Number.isNaN(${node.left.name})`
            );
    context.report({
      node,
      message:
        "Do not compare a variable to itself. Use Number.isNaN to check for NaN.",
      fix,
    });
  },
});

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallows checking for NaN by self comparison",
      recommended: "error",
      extendsBaseRule: false,
      requiresTypeChecking: false,
    },
    fixable: "code",
    hasSuggestions: false,
    schema: [],
  },
  defaultOptions: [],
  create: createPreferNumberIsnan,
};
