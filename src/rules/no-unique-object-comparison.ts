import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/experimental-utils";
import { unionTypeParts } from "tsutils";
import { Type } from "typescript";

const { getParserServices } = ESLintUtils;
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`
);

interface Context {
  getNodeType: (node: TSESTree.Node) => Type;
}

const isAlwaysUniqueObject = (node: TSESTree.Node): boolean => {
  switch (node.type) {
    case AST_NODE_TYPES.ArrayExpression:
    case AST_NODE_TYPES.ObjectExpression:
    case AST_NODE_TYPES.NewExpression:
    case AST_NODE_TYPES.FunctionExpression:
    case AST_NODE_TYPES.ArrowFunctionExpression:
      return true;
    case AST_NODE_TYPES.Literal:
      return "regex" in node && node.regex != null;
    case AST_NODE_TYPES.AssignmentExpression:
      return node.operator === "=" && isAlwaysUniqueObject(node.right);
    case AST_NODE_TYPES.SequenceExpression: {
      const lastExpression = node.expressions[node.expressions.length - 1];
      return isAlwaysUniqueObject(lastExpression);
    }
    default:
      return false;
  }
};

const binaryExpressionComparesIdentity = (
  node: TSESTree.BinaryExpression
): boolean => ["===", "!=="].includes(node.operator);

const getMemberName = (node: TSESTree.MemberExpression): string | null =>
  node.computed
    ? node.property.type === AST_NODE_TYPES.Literal
      ? typeof node.property.value === "string"
        ? node.property.value
        : null
      : null
    : node.property.type === AST_NODE_TYPES.Identifier
    ? node.property.name
    : null;

const isArrayType = (type: Type): boolean => {
  const union = unionTypeParts(type);
  return union
    .map((unionPart) =>
      unionPart.isIntersection() ? unionPart.types : [unionPart]
    )
    .map((intersectionTypes) =>
      (intersectionTypes as { intrinsicName?: string }[])
        .map(({ intrinsicName }) => intrinsicName)
        .filter((name): name is string => name != null)
    )
    .every(
      (intersectionTypeNames) =>
        intersectionTypeNames.length === 0 ||
        intersectionTypeNames.some(RegExp.prototype.test.bind(/\[\]$/))
    );
};

const isArray = (node: TSESTree.Expression, context: Context): boolean => {
  switch (node.type) {
    case AST_NODE_TYPES.ArrayExpression:
      return true;
    case AST_NODE_TYPES.Identifier:
      return isArrayType(context.getNodeType(node));
    default:
      return false;
  }
};

const isArrayPrototypeIdentityCheckingMethod = (
  node: TSESTree.Expression
): boolean => {
  if (
    node.type !== AST_NODE_TYPES.MemberExpression ||
    node.object.type !== AST_NODE_TYPES.MemberExpression ||
    node.object.object.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }
  const level1Name = getMemberName(node);
  if (
    level1Name == null ||
    !["includes", "indexOf", "lastIndexOf"].includes(level1Name)
  ) {
    return false;
  }
  const level2Name = getMemberName(node.object);
  if (level2Name !== "prototype") {
    return false;
  }
  const objectName = node.object.object.name;
  return objectName === "Array";
};

const isObjectPrototype = (node: TSESTree.Expression): boolean =>
  node.type === AST_NODE_TYPES.Identifier && node.name === "Object";

const callExpressionComparesIdentityOfParameters = (
  node: TSESTree.CallExpression,
  context: Context
): Record<number, true | undefined> => {
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
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

export default createRule({
  name: "no-unique-object-comparison",
  meta: {
    type: "problem",
    hasSuggestions: false,
    fixable: undefined,
    docs: {
      description:
        "Disallow comparing objects that cannot identity equal anything by identity",
      recommended: "error",
      extendsBaseRule: false,
      requiresTypeChecking: true,
    },
    messages: {
      comparison:
        "Object will always be unique; it cannot identity equal another",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const parserServices = getParserServices(context, true);
    const checker = parserServices.program.getTypeChecker();
    const getNodeType = (node: TSESTree.Node): Type =>
      checker.getApparentType(
        checker.getTypeAtLocation(
          parserServices.esTreeNodeToTSNodeMap.get(node)
        )
      );

    const reportAlwaysUniqueObjects = (expressions: TSESTree.Node[]): void =>
      expressions
        .filter(isAlwaysUniqueObject)
        .forEach(
          (node) => void context.report({ node, messageId: "comparison" })
        );
    return {
      BinaryExpression: (node): void => {
        if (!binaryExpressionComparesIdentity(node)) {
          return;
        }
        const expressions = [node.left, node.right];
        reportAlwaysUniqueObjects(expressions);
      },
      CallExpression: (node): void => {
        const parameterPositions = callExpressionComparesIdentityOfParameters(
          node,
          { getNodeType }
        );
        const expressions = Object.keys(parameterPositions)
          .map((index) => node.arguments[Number(index)])
          .filter((argument) => argument != null);
        reportAlwaysUniqueObjects(expressions);
      },
      SwitchCase: (node): void => {
        const expressions = [node.test].filter(
          (
            expression
          ): expression is Exclude<typeof expression, null | undefined> =>
            expression != null
        );
        reportAlwaysUniqueObjects(expressions);
      },
    };
  },
});
