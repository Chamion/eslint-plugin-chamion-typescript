"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
exports.createRule = experimental_utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`);
const getNarrowedParam = (params, name) => params
    .filter((param) => param.type === experimental_utils_1.AST_NODE_TYPES.Identifier)
    .find((param) => param.name === name);
const getTernaryLeaves = (expression) => expression.type === experimental_utils_1.AST_NODE_TYPES.ConditionalExpression
    ? [
        ...getTernaryLeaves(expression.consequent),
        ...getTernaryLeaves(expression.alternate),
    ]
    : [expression];
const isIdentifier = (name) => (node) => node.type === experimental_utils_1.AST_NODE_TYPES.Identifier && node.name === name;
const isExcludeExpression = (typeAnnotation) => typeAnnotation.type === experimental_utils_1.AST_NODE_TYPES.TSTypeReference &&
    isIdentifier("Exclude")(typeAnnotation.typeName) &&
    typeAnnotation.typeParameters != null &&
    typeAnnotation.typeParameters.params.length === 2;
const arrayElementsEqual = (equals) => (head, ...rest) => rest.every((list) => list.length === head.length &&
    list.every((element, index) => equals(element, head[index])));
const unorderedEquals = (equals) => (a, b) => {
    if (a.length !== b.length)
        return false;
    const bLeft = [...b];
    return a.every((aElement) => {
        const index = bLeft.findIndex((bElement) => equals(aElement, bElement));
        if (index === -1)
            return false;
        else {
            bLeft.splice(index, 1);
            return true;
        }
    });
};
const templateElementsEqual = (a, b) => a.value.raw === b.value.raw && a.value.cooked === b.value.cooked;
const parameterNamesEqual = (head, ...rest) => head.type === experimental_utils_1.AST_NODE_TYPES.TSThisType
    ? rest.every((parameterName) => parameterName.type === head.type)
    : rest.every(isIdentifier(head.name));
const typeParametersEqual = (head, ...rest) => rest.every((typeParameter) => typeParameter.name.name === head.name.name &&
    typeParameter.in === head.in &&
    typeParameter.out === head.out &&
    nullableEquals(typesEqual)(head.constraint, typeParameter.constraint));
const parametersEqual = (head, ...rest) => {
    switch (head.type) {
        case experimental_utils_1.AST_NODE_TYPES.Identifier:
            return rest.every((parameter) => {
                var _a, _b;
                return parameter.type === head.type &&
                    parameter.name === head.name &&
                    nullableEquals(typesEqual)((_a = head.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation, (_b = parameter.typeAnnotation) === null || _b === void 0 ? void 0 : _b.typeAnnotation);
            });
        case experimental_utils_1.AST_NODE_TYPES.RestElement:
            return rest.every((parameter) => {
                var _a, _b;
                return parameter.type === head.type &&
                    nullableEquals(typesEqual)((_a = head.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation, (_b = parameter.typeAnnotation) === null || _b === void 0 ? void 0 : _b.typeAnnotation);
            } // TODO: further comparison
            );
        default:
            // These cases should not happen in a type expression
            return true;
    }
};
const entityNamesEqual = (head, ...rest) => {
    switch (head.type) {
        case experimental_utils_1.AST_NODE_TYPES.ThisExpression:
            return rest.every((entityName) => entityName.type === head.type);
        case experimental_utils_1.AST_NODE_TYPES.Identifier:
            return rest.every((entityName) => entityName.type === head.type && entityName.name === head.name);
        case experimental_utils_1.AST_NODE_TYPES.TSQualifiedName:
            return rest.every((entityName) => entityName.type === head.type &&
                entityNamesEqual(entityName.left, head.left) &&
                entityNamesEqual(entityName.right, head.right));
    }
};
const keysEqual = (head, ...rest) => {
    switch (head.type) {
        case experimental_utils_1.AST_NODE_TYPES.Identifier:
            return rest.every((key) => key.type === head.type && key.name === head.name);
        case experimental_utils_1.AST_NODE_TYPES.Literal:
            return rest.every((key) => key.type === head.type && key.value === head.value);
        default:
            // TODO: handle rest of cases
            return true;
    }
};
const membersEqual = (head, ...rest) => {
    switch (head.type) {
        case experimental_utils_1.AST_NODE_TYPES.TSPropertySignature:
            return rest.every((member) => member.type === head.type &&
                keysEqual(member.key, head.key) &&
                member.optional === head.optional &&
                member.readonly === head.readonly);
        case experimental_utils_1.AST_NODE_TYPES.TSIndexSignature:
            return rest.every((member) => {
                var _a, _b;
                return member.type === head.type &&
                    member.readonly === head.readonly &&
                    nullableEquals(typesEqual)((_a = member.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation, (_b = head.typeAnnotation) === null || _b === void 0 ? void 0 : _b.typeAnnotation);
            });
        case experimental_utils_1.AST_NODE_TYPES.TSMethodSignature:
            return rest.every((member) => {
                var _a, _b, _c, _d;
                return member.type === head.type &&
                    keysEqual(member.key, head.key) &&
                    member.readonly === head.readonly &&
                    member.optional === head.optional &&
                    member.kind === head.kind &&
                    arrayElementsEqual(parametersEqual)(member.params, head.params) &&
                    nullableEquals(typesEqual)((_a = member.returnType) === null || _a === void 0 ? void 0 : _a.typeAnnotation, (_b = head.returnType) === null || _b === void 0 ? void 0 : _b.typeAnnotation) &&
                    nullableEquals(arrayElementsEqual(typeParametersEqual))((_c = member.typeParameters) === null || _c === void 0 ? void 0 : _c.params, (_d = head.typeParameters) === null || _d === void 0 ? void 0 : _d.params);
            });
        case experimental_utils_1.AST_NODE_TYPES.TSCallSignatureDeclaration:
        case experimental_utils_1.AST_NODE_TYPES.TSConstructSignatureDeclaration:
            return rest.every((member) => {
                var _a, _b, _c, _d;
                return member.type === head.type &&
                    arrayElementsEqual(parametersEqual)(member.params, head.params) &&
                    nullableEquals(typesEqual)((_a = member.returnType) === null || _a === void 0 ? void 0 : _a.typeAnnotation, (_b = head.returnType) === null || _b === void 0 ? void 0 : _b.typeAnnotation) &&
                    nullableEquals(arrayElementsEqual(typeParametersEqual))((_c = member.typeParameters) === null || _c === void 0 ? void 0 : _c.params, (_d = head.typeParameters) === null || _d === void 0 ? void 0 : _d.params);
            });
        default:
            return true;
    }
};
const nullableEquals = (equals) => (head, ...rest) => head == null
    ? rest.every((element) => element == null)
    : rest.every((element) => element != null && equals(head, element));
const typesEqual = (a, b) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (a.type !== b.type)
        return false;
    switch (a.type) {
        case experimental_utils_1.AST_NODE_TYPES.TSArrayType: {
            const castB = b;
            return typesEqual(a.elementType, castB.elementType);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSMappedType: {
            const castB = b;
            return (typeParametersEqual(a.typeParameter, castB.typeParameter) &&
                nullableEquals(typesEqual)(a.nameType, castB.nameType) &&
                a.optional === castB.optional &&
                a.readonly === castB.readonly &&
                nullableEquals(typesEqual)(a.typeAnnotation, castB.typeAnnotation));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSOptionalType:
        case experimental_utils_1.AST_NODE_TYPES.TSRestType: {
            const castB = b;
            return typesEqual(a.typeAnnotation, castB.typeAnnotation);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSTypeOperator: {
            const castB = b;
            return (a.operator === castB.operator &&
                nullableEquals(typesEqual)(a.typeAnnotation, castB.typeAnnotation));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSTypePredicate: {
            const castB = b;
            return (parameterNamesEqual(a.parameterName, castB.parameterName) &&
                a.asserts === castB.asserts &&
                nullableEquals(typesEqual)((_a = a.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation, (_b = castB.typeAnnotation) === null || _b === void 0 ? void 0 : _b.typeAnnotation));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSTemplateLiteralType: {
            const castB = b;
            return (arrayElementsEqual(templateElementsEqual)(a.quasis, castB.quasis) &&
                arrayElementsEqual(typesEqual)(a.types, castB.types));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSUnionType:
        case experimental_utils_1.AST_NODE_TYPES.TSIntersectionType: {
            const castB = b;
            return unorderedEquals(typesEqual)(a.types, castB.types);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSTupleType: {
            const castB = b;
            return arrayElementsEqual(typesEqual)(a.elementTypes, castB.elementTypes);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSConditionalType: {
            const castB = b;
            return (typesEqual(a.checkType, castB.checkType) &&
                typesEqual(a.extendsType, castB.extendsType) &&
                typesEqual(a.falseType, castB.falseType) &&
                typesEqual(a.trueType, castB.trueType));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSFunctionType: {
            const castB = b;
            return (nullableEquals(typesEqual)((_c = a.returnType) === null || _c === void 0 ? void 0 : _c.typeAnnotation, (_d = castB.returnType) === null || _d === void 0 ? void 0 : _d.typeAnnotation) &&
                nullableEquals(arrayElementsEqual(typeParametersEqual))((_e = a.typeParameters) === null || _e === void 0 ? void 0 : _e.params, (_f = castB.typeParameters) === null || _f === void 0 ? void 0 : _f.params) &&
                arrayElementsEqual(parametersEqual)(a.params, castB.params));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSInferType: {
            const castB = b;
            return typeParametersEqual(a.typeParameter, castB.typeParameter);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSTypeReference: {
            const castB = b;
            return (entityNamesEqual(a.typeName, castB.typeName) &&
                nullableEquals(arrayElementsEqual(typesEqual))((_g = a.typeParameters) === null || _g === void 0 ? void 0 : _g.params, (_h = castB.typeParameters) === null || _h === void 0 ? void 0 : _h.params));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSNamedTupleMember: {
            const castB = b;
            return (a.label.name === castB.label.name &&
                typesEqual(a.elementType, castB.elementType));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSIndexedAccessType: {
            const castB = b;
            return (typesEqual(a.indexType, castB.indexType) &&
                typesEqual(a.objectType, castB.objectType));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSConstructorType: {
            const castB = b;
            return (a.abstract === castB.abstract &&
                nullableEquals(typesEqual)((_j = a.returnType) === null || _j === void 0 ? void 0 : _j.typeAnnotation, (_k = castB.returnType) === null || _k === void 0 ? void 0 : _k.typeAnnotation) &&
                nullableEquals(arrayElementsEqual(typeParametersEqual))((_l = a.typeParameters) === null || _l === void 0 ? void 0 : _l.params, (_m = castB.typeParameters) === null || _m === void 0 ? void 0 : _m.params));
        }
        case experimental_utils_1.AST_NODE_TYPES.TSLiteralType: {
            const castB = b;
            if (a.literal.type !== experimental_utils_1.AST_NODE_TYPES.Literal)
                return true; // Other cases shouldn't appear in types
            return (castB.literal.type === experimental_utils_1.AST_NODE_TYPES.Literal &&
                a.literal.value === castB.literal.value);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSQualifiedName: {
            const castB = b;
            return entityNamesEqual(a, castB);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSTypeLiteral: {
            const castB = b;
            return unorderedEquals(membersEqual)(a.members, castB.members);
        }
        case experimental_utils_1.AST_NODE_TYPES.TSAbstractKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSAnyKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSAsyncKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSBigIntKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSExportKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSDeclareKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSIntrinsicKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSNeverKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSNullKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSObjectKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSPrivateKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSProtectedKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSPublicKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSReadonlyKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSStaticKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSStringKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSThisType:
        case experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSUnknownKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSVoidKeyword:
            return true;
        case experimental_utils_1.AST_NODE_TYPES.TSImportType:
        case experimental_utils_1.AST_NODE_TYPES.TSTypeQuery:
        default:
            // Default to not report a problem if comparison is not implemented
            return true;
    }
};
exports.default = (0, exports.createRule)({
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
        if (scopeManager == null)
            return {};
        const getText = ({ range }) => text.substring(range[0], range[1]);
        const isNarrowingReturnExpression = (expression) => {
            if (expression.type !== experimental_utils_1.AST_NODE_TYPES.SequenceExpression)
                return false;
            const [maybeSatisfies, maybeLiteral] = expression.expressions;
            if (maybeLiteral == null ||
                maybeLiteral.type !== experimental_utils_1.AST_NODE_TYPES.Literal ||
                typeof maybeLiteral.value !== "boolean")
                return false;
            return maybeSatisfies.type === experimental_utils_1.AST_NODE_TYPES.TSSatisfiesExpression;
        };
        const getImmediateExecutionPathScopes = (scope) => {
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
                ...immediateExecutionChildScopes.flatMap(getImmediateExecutionPathScopes),
            ];
        };
        const getStatementsIn = (scope) => {
            switch (scope.type) {
                case "function":
                    if (scope.block.body == null)
                        return [];
                    else if (Array.isArray(scope.block.body))
                        return scope.block.body;
                    else if (scope.block.body.type === experimental_utils_1.AST_NODE_TYPES.BlockStatement)
                        return scope.block.body.body;
                    else
                        return [];
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
        const getReturnExpressions = (scope) => {
            if (scope.type !== "function")
                return [];
            const { block } = scope;
            const body = "body" in block ? block.body : null;
            if (body == null || Array.isArray(body))
                return [];
            switch (body.type) {
                case experimental_utils_1.AST_NODE_TYPES.BlockStatement:
                    return getImmediateExecutionPathScopes(scope)
                        .flatMap((childScope) => getStatementsIn(childScope))
                        .filter((statement) => statement.type === experimental_utils_1.AST_NODE_TYPES.ReturnStatement)
                        .map((returnStatement) => returnStatement.argument)
                        .filter((maybeExpression) => maybeExpression != null);
                default:
                    return [body];
            }
        };
        const visitFunction = (node) => {
            const { returnType } = node;
            if (returnType == null)
                return;
            const { typeAnnotation } = returnType;
            if (typeAnnotation.type !== experimental_utils_1.AST_NODE_TYPES.TSTypePredicate ||
                typeAnnotation.asserts)
                return;
            const { parameterName, typeAnnotation: isType } = typeAnnotation;
            const name = parameterName.type === experimental_utils_1.AST_NODE_TYPES.TSThisType
                ? "this"
                : parameterName.name;
            const narrowedParam = getNarrowedParam(node.params, name);
            if (narrowedParam == null)
                return;
            const paramType = narrowedParam.typeAnnotation;
            if (paramType == null || isType == null)
                return;
            const scope = scopeManager.acquire(node);
            if (scope == null || scope.type !== "function")
                return;
            const returnLeaves = getReturnExpressions(scope).flatMap(getTernaryLeaves);
            const narrowingReturnLeaves = returnLeaves.filter(isNarrowingReturnExpression);
            narrowingReturnLeaves.forEach(({ expressions: [satisfies, literal] }) => {
                const satisfiesType = satisfies.typeAnnotation;
                if (literal.value) {
                    if (!typesEqual(satisfiesType, isType.typeAnnotation)) {
                        context.report({
                            node: satisfiesType,
                            messageId: "return",
                            fix: (fixer) => fixer.replaceText(satisfiesType, getText(isType.typeAnnotation)),
                        });
                    }
                }
                else if (isExcludeExpression(satisfiesType)) {
                    const [excludedFrom, exclusion] = satisfiesType.typeParameters.params;
                    if (!typesEqual(excludedFrom, paramType.typeAnnotation)) {
                        context.report({
                            node: excludedFrom,
                            messageId: "param",
                            fix: (fixer) => fixer.replaceText(excludedFrom, getText(paramType.typeAnnotation)),
                        });
                    }
                    if (!typesEqual(exclusion, isType.typeAnnotation)) {
                        context.report({
                            node: exclusion,
                            messageId: "return",
                            fix: (fixer) => fixer.replaceText(exclusion, getText(isType.typeAnnotation)),
                        });
                    }
                }
            });
        };
        return {
            [experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression]: visitFunction,
            [experimental_utils_1.AST_NODE_TYPES.FunctionExpression]: visitFunction,
            [experimental_utils_1.AST_NODE_TYPES.FunctionDeclaration]: visitFunction,
        };
    },
});
