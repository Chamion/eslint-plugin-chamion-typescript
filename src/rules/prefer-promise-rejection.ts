import {
  AST_NODE_TYPES,
  TSESTree,
  ESLintUtils,
} from "@typescript-eslint/experimental-utils";
import { isThenableType, unionTypeParts } from "tsutils";
import { Type } from "typescript";

const { getParserServices } = ESLintUtils;
const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`
);

// Copy-pasted from no-unsafe-return
const getParentFunctionNode = (
  node: TSESTree.Node
):
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | null => {
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression
    ) {
      return current;
    }

    current = current.parent;
  }

  // this shouldn't happen in correct code, but someone may attempt to parse bad code
  // the parser won't error, so we shouldn't throw here
  /* istanbul ignore next */ return null;
};

export default createRule({
  name: "prefer-promise-rejection",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow throwing in a function that always returns a promise",
      recommended: false,
      extendsBaseRule: false,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    messages: {
      throw:
        "Unexpected throw statement in a function that returns promise. Did you mean to return a rejecting promise instead?",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const parserServices = getParserServices(context, true);
    const checker = parserServices.program.getTypeChecker();

    const getReturnTypeUnionSubTypes = (type: Type): Type[] =>
      unionTypeParts(type)
        .flatMap((subType) => subType.getCallSignatures())
        .map((signature) => signature.getReturnType())
        .flatMap((returnType) => unionTypeParts(returnType));

    return {
      ThrowStatement: (node): void => {
        const parent = getParentFunctionNode(node);
        if (parent == null || parent.async) {
          return;
        }
        const parentType = checker.getApparentType(
          checker.getTypeAtLocation(
            parserServices.esTreeNodeToTSNodeMap.get(parent)
          )
        );
        const returnTypes = getReturnTypeUnionSubTypes(parentType);
        const returnsPromise = returnTypes.every((returnType) =>
          isThenableType(
            checker,
            parserServices.esTreeNodeToTSNodeMap.get(parent),
            returnType
          )
        );
        if (returnsPromise) {
          context.report({
            node,
            messageId: "throw",
          });
        }
      },
    };
  },
});
