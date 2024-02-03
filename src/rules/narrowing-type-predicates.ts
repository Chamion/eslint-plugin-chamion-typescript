import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/experimental-utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`
);

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration;

const getNarrowedParam = (params: FunctionNode["params"], name: string) =>
  params
    .filter(
      (param): param is TSESTree.Identifier =>
        param.type === AST_NODE_TYPES.Identifier
    )
    .find((param) => param.name === name);

const getTernaryLeaves = (
  expression: TSESTree.Expression
): TSESTree.Expression[] =>
  expression.type === AST_NODE_TYPES.ConditionalExpression
    ? [
        ...getTernaryLeaves(expression.consequent),
        ...getTernaryLeaves(expression.alternate),
      ]
    : [expression];

const isIdentifier = (name: string) => (node: TSESTree.Node) =>
  node.type === AST_NODE_TYPES.Identifier && node.name === name;

const isExcludeExpression = (
  typeAnnotation: TSESTree.TypeNode
): typeAnnotation is TSESTree.TSTypeReference & {
  typeParameters: { params: [TSESTree.TypeNode, TSESTree.TypeNode] };
} =>
  typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
  isIdentifier("Exclude")(typeAnnotation.typeName) &&
  typeAnnotation.typeParameters != null &&
  typeAnnotation.typeParameters.params.length === 2;

export default createRule({
  name: "narrowing-type-predicates",
  meta: {
    type: "problem",
    docs: {
      description: "Assert safe use of narrowing type predicates",
      recommended: false,
      extendsBaseRule: false,
      requiresTypeChecking: true,
    },
    hasSuggestions: true,
    messages: {
      return: "narrowed type constraint does not match return type",
      param: "narrowed type constraint does not match parameter type",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const { getText, getTokens, scopeManager } = context.getSourceCode();
    if (scopeManager == null) return {};
    type Scope = NonNullable<ReturnType<(typeof scopeManager)["acquire"]>>;

    const tokenEquals = (a: TSESTree.Node, b: TSESTree.Node) => {
      const aTokens = getTokens(a);
      const bTokens = getTokens(b);
      return (
        aTokens.length === bTokens.length &&
        aTokens.every(
          (_, index) =>
            aTokens[index].value === bTokens[index].value &&
            aTokens[index].type === bTokens[index].type
        )
      );
    };

    const isNarrowingReturnExpression = (
      expression: TSESTree.Expression
    ): expression is TSESTree.SequenceExpression & {
      expressions: [TSESTree.TSSatisfiesExpression, TSESTree.BooleanLiteral];
    } => {
      if (expression.type !== AST_NODE_TYPES.SequenceExpression) return false;
      const [maybeSatisfies, maybeLiteral] = expression.expressions;
      if (
        maybeLiteral == null ||
        maybeLiteral.type !== AST_NODE_TYPES.Literal ||
        typeof maybeLiteral.value !== "boolean"
      )
        return false;
      return maybeSatisfies.type === AST_NODE_TYPES.TSSatisfiesExpression;
    };

    const getImmediateExecutionPathScopes = (scope: Scope): Scope[] => {
      const { childScopes } = scope;
      const immediateExecutionChildScopes = childScopes.filter((scope) => {
        switch (scope.type) {
          case "block":
          case "catch":
          case "for":
            return true;
          default:
            return false;
        }
      });
      return [
        scope,
        ...immediateExecutionChildScopes.flatMap(
          getImmediateExecutionPathScopes
        ),
      ];
    };

    const getStatementsIn = (scope: Scope): TSESTree.Statement[] => {
      switch (scope.type) {
        case "block":
          return scope.block.body;
        case "catch":
          return scope.block.body.body;
        case "for":
          return [scope.block.body];
        case "switch":
          return scope.block.cases.flatMap(({ consequent }) => consequent);
        default:
          return [];
      }
    };

    const getReturnExpressions = (scope: Scope): TSESTree.Expression[] => {
      if (scope.type !== "function") return [];
      const { block } = scope;
      const body = "body" in block ? block.body : null;
      if (body == null || Array.isArray(body)) return [];
      switch (body.type) {
        case AST_NODE_TYPES.BlockStatement:
          return getImmediateExecutionPathScopes(scope)
            .flatMap((childScope) => getStatementsIn(childScope))
            .filter(
              (statement): statement is TSESTree.ReturnStatement =>
                statement.type === AST_NODE_TYPES.ReturnStatement
            )
            .map((returnStatement) => returnStatement.argument)
            .filter(
              (
                maybeExpression
              ): maybeExpression is NonNullable<typeof maybeExpression> =>
                maybeExpression != null
            );
        default:
          return [body];
      }
    };

    const visitFunction = (node: FunctionNode) => {
      const { returnType } = node;
      if (returnType == null) return;
      const { typeAnnotation } = returnType;
      if (
        typeAnnotation.type !== AST_NODE_TYPES.TSTypePredicate ||
        typeAnnotation.asserts
      )
        return;
      const { parameterName, typeAnnotation: isType } = typeAnnotation;
      const name =
        parameterName.type === AST_NODE_TYPES.TSThisType
          ? "this"
          : parameterName.name;
      const narrowedParam = getNarrowedParam(node.params, name);
      if (narrowedParam == null) return;
      const paramType = narrowedParam.typeAnnotation;
      if (paramType == null || isType == null) return;
      const scope = scopeManager.acquire(node);
      if (scope == null || scope.type !== "function") return;
      const returnLeaves =
        getReturnExpressions(scope).flatMap(getTernaryLeaves);
      const narrowingReturnLeaves = returnLeaves.filter(
        isNarrowingReturnExpression
      );
      narrowingReturnLeaves.forEach(({ expressions: [satisfies, literal] }) => {
        const satisfiesType = satisfies.typeAnnotation;
        if (literal.value) {
          if (!tokenEquals(satisfiesType, isType.typeAnnotation)) {
            context.report({
              node: satisfiesType,
              messageId: "return",
              fix: (fixer) =>
                fixer.replaceText(
                  satisfiesType,
                  getText(isType.typeAnnotation)
                ),
            });
          }
        } else if (isExcludeExpression(satisfiesType)) {
          const [excludedFrom, exclusion] = satisfiesType.typeParameters.params;
          if (!tokenEquals(excludedFrom, paramType.typeAnnotation)) {
            context.report({
              node: excludedFrom,
              messageId: "param",
              fix: (fixer) =>
                fixer.replaceText(
                  excludedFrom,
                  getText(paramType.typeAnnotation)
                ),
            });
          }
          if (!tokenEquals(exclusion, isType.typeAnnotation)) {
            context.report({
              node: exclusion,
              messageId: "return",
              fix: (fixer) =>
                fixer.replaceText(exclusion, getText(isType.typeAnnotation)),
            });
          }
        }
      });
    };
    return {
      [AST_NODE_TYPES.ArrowFunctionExpression]: visitFunction,
      [AST_NODE_TYPES.FunctionExpression]: visitFunction,
      [AST_NODE_TYPES.FunctionDeclaration]: visitFunction,
    };
  },
});
