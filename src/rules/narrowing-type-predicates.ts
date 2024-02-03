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

const arrayElementsEqual =
  <T>(equals: (a: T, b: T) => boolean) =>
  (head: readonly T[], ...rest: readonly (readonly T[])[]) =>
    rest.every(
      (list) =>
        list.length === head.length &&
        list.every((element, index) => equals(element, head[index]))
    );

const templateElementsEqual = (
  a: TSESTree.TemplateElement,
  b: TSESTree.TemplateElement
) => a.value.raw === b.value.raw && a.value.cooked === b.value.cooked;

const parameterNamesEqual = (
  head: TSESTree.Identifier | TSESTree.TSThisType,
  ...rest: readonly (TSESTree.Identifier | TSESTree.TSThisType)[]
) =>
  head.type === AST_NODE_TYPES.TSThisType
    ? rest.every((parameterName) => parameterName.type === head.type)
    : rest.every(isIdentifier(head.name));

const typeParametersEqual = (
  head: TSESTree.TSTypeParameter,
  ...rest: readonly TSESTree.TSTypeParameter[]
) =>
  rest.every(
    (typeParameter) =>
      typeParameter.name.name === head.name.name &&
      typeParameter.in === head.in &&
      typeParameter.out === head.out &&
      nullableEquals(typesEqual)(head.constraint, typeParameter.constraint)
  );

const parametersEqual = (
  head: TSESTree.Parameter,
  ...rest: readonly TSESTree.Parameter[]
) => {
  switch (head.type) {
    case AST_NODE_TYPES.Identifier:
      return rest.every(
        (parameter) =>
          parameter.type === head.type &&
          parameter.name === head.name &&
          nullableEquals(typesEqual)(
            head.typeAnnotation?.typeAnnotation,
            parameter.typeAnnotation?.typeAnnotation
          )
      );
    case AST_NODE_TYPES.RestElement:
      return rest.every(
        (parameter) =>
          parameter.type === head.type &&
          nullableEquals(typesEqual)(
            head.typeAnnotation?.typeAnnotation,
            parameter.typeAnnotation?.typeAnnotation
          ) // TODO: further comparison
      );
    default:
      // These cases should not happen in a type expression
      return true;
  }
};

const entityNamesEqual = (
  head: TSESTree.EntityName,
  ...rest: readonly TSESTree.EntityName[]
): boolean => {
  switch (head.type) {
    case AST_NODE_TYPES.ThisExpression:
      return rest.every((entityName) => entityName.type === head.type);
    case AST_NODE_TYPES.Identifier:
      return rest.every(
        (entityName) =>
          entityName.type === head.type && entityName.name === head.name
      );
    case AST_NODE_TYPES.TSQualifiedName:
      return rest.every(
        (entityName) =>
          entityName.type === head.type &&
          entityNamesEqual(entityName.left, head.left) &&
          entityNamesEqual(entityName.right, head.right)
      );
  }
};

const keysEqual = (
  head: TSESTree.TSPropertySignature["key"],
  ...rest: readonly TSESTree.TSPropertySignature["key"][]
) => {
  switch (head.type) {
    case AST_NODE_TYPES.Identifier:
      return rest.every(
        (key) => key.type === head.type && key.name === head.name
      );
    case AST_NODE_TYPES.Literal:
      return rest.every(
        (key) => key.type === head.type && key.value === head.value
      );
    default:
      // TODO: handle rest of cases
      return true;
  }
};

const membersEqual = (
  head: TSESTree.TypeElement,
  ...rest: readonly TSESTree.TypeElement[]
) => {
  switch (head.type) {
    case AST_NODE_TYPES.TSPropertySignature:
      return rest.every(
        (member) =>
          member.type === head.type &&
          keysEqual(member.key, head.key) &&
          member.optional === head.optional &&
          member.readonly === head.readonly
      );
    case AST_NODE_TYPES.TSIndexSignature:
      return rest.every(
        (member) =>
          member.type === head.type &&
          member.readonly === head.readonly &&
          nullableEquals(typesEqual)(
            member.typeAnnotation?.typeAnnotation,
            head.typeAnnotation?.typeAnnotation
          )
      );
    case AST_NODE_TYPES.TSMethodSignature:
      return rest.every(
        (member) =>
          member.type === head.type &&
          keysEqual(member.key, head.key) &&
          member.readonly === head.readonly &&
          member.optional === head.optional &&
          member.kind === head.kind &&
          arrayElementsEqual(parametersEqual)(member.params, head.params) &&
          nullableEquals(typesEqual)(
            member.returnType?.typeAnnotation,
            head.returnType?.typeAnnotation
          ) &&
          nullableEquals(arrayElementsEqual(typeParametersEqual))(
            member.typeParameters?.params,
            head.typeParameters?.params
          )
      );
    case AST_NODE_TYPES.TSCallSignatureDeclaration:
    case AST_NODE_TYPES.TSConstructSignatureDeclaration:
      return rest.every(
        (member) =>
          member.type === head.type &&
          arrayElementsEqual(parametersEqual)(member.params, head.params) &&
          nullableEquals(typesEqual)(
            member.returnType?.typeAnnotation,
            head.returnType?.typeAnnotation
          ) &&
          nullableEquals(arrayElementsEqual(typeParametersEqual))(
            member.typeParameters?.params,
            head.typeParameters?.params
          )
      );
    default:
      return true;
  }
};

const nullableEquals =
  <T>(equals: (a: T, b: T) => boolean) =>
  (head: T | null | undefined, ...rest: readonly (T | null | undefined)[]) =>
    head == null
      ? rest.every((element) => element == null)
      : rest.every((element) => element != null && equals(head, element));

const typesEqual = (a: TSESTree.TypeNode, b: TSESTree.TypeNode): boolean => {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case AST_NODE_TYPES.TSArrayType: {
      const castB = b as any as typeof a;
      return typesEqual(a.elementType, castB.elementType);
    }
    case AST_NODE_TYPES.TSMappedType: {
      const castB = b as any as typeof a;
      return (
        typeParametersEqual(a.typeParameter, castB.typeParameter) &&
        nullableEquals(typesEqual)(a.nameType, castB.nameType) &&
        a.optional === castB.optional &&
        a.readonly === castB.readonly &&
        nullableEquals(typesEqual)(a.typeAnnotation, castB.typeAnnotation)
      );
    }
    case AST_NODE_TYPES.TSOptionalType:
    case AST_NODE_TYPES.TSRestType: {
      const castB = b as any as typeof a;
      return typesEqual(a.typeAnnotation, castB.typeAnnotation);
    }
    case AST_NODE_TYPES.TSTypeOperator: {
      const castB = b as any as typeof a;
      return (
        a.operator === castB.operator &&
        nullableEquals(typesEqual)(a.typeAnnotation, castB.typeAnnotation)
      );
    }
    case AST_NODE_TYPES.TSTypePredicate: {
      const castB = b as any as typeof a;
      return (
        parameterNamesEqual(a.parameterName, castB.parameterName) &&
        a.asserts === castB.asserts &&
        nullableEquals(typesEqual)(
          a.typeAnnotation?.typeAnnotation,
          castB.typeAnnotation?.typeAnnotation
        )
      );
    }
    case AST_NODE_TYPES.TSTemplateLiteralType: {
      const castB = b as any as typeof a;
      return (
        arrayElementsEqual(templateElementsEqual)(a.quasis, castB.quasis) &&
        arrayElementsEqual(typesEqual)(a.types, castB.types)
      );
    }
    case AST_NODE_TYPES.TSUnionType:
    case AST_NODE_TYPES.TSIntersectionType: {
      const castB = b as any as typeof a;
      return arrayElementsEqual(typesEqual)(a.types, castB.types);
    }
    case AST_NODE_TYPES.TSTupleType: {
      const castB = b as any as typeof a;
      return arrayElementsEqual(typesEqual)(a.elementTypes, castB.elementTypes);
    }
    case AST_NODE_TYPES.TSConditionalType: {
      const castB = b as any as typeof a;
      return (
        typesEqual(a.checkType, castB.checkType) &&
        typesEqual(a.extendsType, castB.extendsType) &&
        typesEqual(a.falseType, castB.falseType) &&
        typesEqual(a.trueType, castB.trueType)
      );
    }
    case AST_NODE_TYPES.TSFunctionType: {
      const castB = b as any as typeof a;
      return (
        nullableEquals(typesEqual)(
          a.returnType?.typeAnnotation,
          castB.returnType?.typeAnnotation
        ) &&
        nullableEquals(arrayElementsEqual(typeParametersEqual))(
          a.typeParameters?.params,
          castB.typeParameters?.params
        ) &&
        arrayElementsEqual(parametersEqual)(a.params, castB.params)
      );
    }
    case AST_NODE_TYPES.TSInferType: {
      const castB = b as any as typeof a;
      return typeParametersEqual(a.typeParameter, castB.typeParameter);
    }
    case AST_NODE_TYPES.TSTypeReference: {
      const castB = b as any as typeof a;
      return (
        entityNamesEqual(a.typeName, castB.typeName) &&
        nullableEquals(arrayElementsEqual(typesEqual))(
          a.typeParameters?.params,
          castB.typeParameters?.params
        )
      );
    }
    case AST_NODE_TYPES.TSNamedTupleMember: {
      const castB = b as any as typeof a;
      return (
        a.label.name === castB.label.name &&
        typesEqual(a.elementType, castB.elementType)
      );
    }
    case AST_NODE_TYPES.TSIndexedAccessType: {
      const castB = b as any as typeof a;
      return (
        typesEqual(a.indexType, castB.indexType) &&
        typesEqual(a.objectType, castB.objectType)
      );
    }
    case AST_NODE_TYPES.TSConstructorType: {
      const castB = b as any as typeof a;
      return (
        a.abstract === castB.abstract &&
        nullableEquals(typesEqual)(
          a.returnType?.typeAnnotation,
          castB.returnType?.typeAnnotation
        ) &&
        nullableEquals(arrayElementsEqual(typeParametersEqual))(
          a.typeParameters?.params,
          castB.typeParameters?.params
        )
      );
    }
    case AST_NODE_TYPES.TSLiteralType: {
      const castB = b as any as typeof a;
      if (a.literal.type !== AST_NODE_TYPES.Literal) return true; // Other cases shouldn't appear in types
      return (
        castB.literal.type === AST_NODE_TYPES.Literal &&
        a.literal.value === castB.literal.value
      );
    }
    case AST_NODE_TYPES.TSQualifiedName: {
      const castB = b as any as typeof a;
      return entityNamesEqual(a, castB);
    }
    case AST_NODE_TYPES.TSTypeLiteral: {
      const castB = b as any as typeof a;
      return arrayElementsEqual(membersEqual)(a.members, castB.members);
    }
    case AST_NODE_TYPES.TSAbstractKeyword:
    case AST_NODE_TYPES.TSAnyKeyword:
    case AST_NODE_TYPES.TSAsyncKeyword:
    case AST_NODE_TYPES.TSBigIntKeyword:
    case AST_NODE_TYPES.TSBooleanKeyword:
    case AST_NODE_TYPES.TSExportKeyword:
    case AST_NODE_TYPES.TSDeclareKeyword:
    case AST_NODE_TYPES.TSIntrinsicKeyword:
    case AST_NODE_TYPES.TSNeverKeyword:
    case AST_NODE_TYPES.TSNullKeyword:
    case AST_NODE_TYPES.TSNumberKeyword:
    case AST_NODE_TYPES.TSObjectKeyword:
    case AST_NODE_TYPES.TSPrivateKeyword:
    case AST_NODE_TYPES.TSProtectedKeyword:
    case AST_NODE_TYPES.TSPublicKeyword:
    case AST_NODE_TYPES.TSReadonlyKeyword:
    case AST_NODE_TYPES.TSStaticKeyword:
    case AST_NODE_TYPES.TSStringKeyword:
    case AST_NODE_TYPES.TSSymbolKeyword:
    case AST_NODE_TYPES.TSThisType:
    case AST_NODE_TYPES.TSUndefinedKeyword:
    case AST_NODE_TYPES.TSUnknownKeyword:
    case AST_NODE_TYPES.TSVoidKeyword:
      return true;
    case AST_NODE_TYPES.TSImportType:
    case AST_NODE_TYPES.TSTypeQuery:
    default:
      // Default to not report a problem if comparison is not implemented
      return true;
  }
};

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
    hasSuggestions: false,
    fixable: "code",
    messages: {
      return: "narrowed type constraint does not match return type",
      param: "narrowed type constraint does not match parameter type",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const { text, scopeManager } = context.getSourceCode();
    if (scopeManager == null) return {};
    type Scope = NonNullable<ReturnType<(typeof scopeManager)["acquire"]>>;

    const getText = ({ range }: { range: [number, number] }) =>
      text.substring(range[0], range[1]);

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
          case "switch":
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
        case "function":
          if (scope.block.body == null) return [];
          else if (Array.isArray(scope.block.body)) return scope.block.body;
          else if (scope.block.body.type === AST_NODE_TYPES.BlockStatement)
            return scope.block.body.body;
          else return [];
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
          if (!typesEqual(satisfiesType, isType.typeAnnotation)) {
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
          if (!typesEqual(excludedFrom, paramType.typeAnnotation)) {
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
          if (!typesEqual(exclusion, isType.typeAnnotation)) {
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
