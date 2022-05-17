"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const tsutils_1 = require("tsutils");
const { getParserServices } = experimental_utils_1.ESLintUtils;
exports.createRule = experimental_utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`);
const isFunctionType = (type) => (0, tsutils_1.unionTypeParts)(type).every((typePart) => typePart.getCallSignatures().length > 0);
const voidTypeNames = ["undefined", "void", "never"];
const isVoidType = (type) => {
    const { intrinsicName } = type;
    return intrinsicName != null && voidTypeNames.includes(intrinsicName);
};
exports.default = (0, exports.createRule)({
    name: "no-return-into-void",
    meta: {
        type: "problem",
        docs: {
            description: "Disallow returning a value in a function whose return value is voided.",
            recommended: false,
            extendsBaseRule: false,
            requiresTypeChecking: true,
        },
        hasSuggestions: false,
        messages: {
            "will-be-voided": "Return value is useless. It will be voided.",
        },
        schema: [
            {
                type: "object",
                additionalProperties: false,
                required: ["targets"],
                properties: {
                    targets: {
                        type: "array",
                        elements: {
                            type: "string",
                            enum: ["lambda", "identifier"],
                        },
                    },
                },
            },
        ],
    },
    defaultOptions: [
        {
            targets: ["lambda"],
        },
    ],
    create: (context, [{ targets }]) => {
        const parserServices = getParserServices(context, true);
        const checker = parserServices.program.getTypeChecker();
        const getReturnTypeUnionSubTypes = (type) => (0, tsutils_1.unionTypeParts)(type)
            .flatMap((subType) => subType.getCallSignatures())
            .map((signature) => signature.getReturnType())
            .flatMap((returnType) => (0, tsutils_1.unionTypeParts)(returnType));
        const getParametersTypeUnionSubTypes = (node, length) => (type) => {
            const parametersOfCallSignatures = (0, tsutils_1.unionTypeParts)(type)
                .flatMap((subType) => subType.getCallSignatures())
                .map((signature) => signature.getParameters())
                .filter((parameters) => parameters.length === length);
            if (parametersOfCallSignatures.length === 0) {
                return [];
            }
            const parameters = parametersOfCallSignatures[0].map((_, index) => parametersOfCallSignatures.map((callSignatureParameters) => callSignatureParameters[index]));
            return parameters.map((parameters) => parameters.map((parameter) => checker.getApparentType(checker.getTypeOfSymbolAtLocation(parameter, node))));
        };
        const isVoidFunctionType = (type) => isFunctionType(type) &&
            getReturnTypeUnionSubTypes(type).every(isVoidType);
        return {
            CallExpression: (node) => {
                const { callee, arguments: args } = node;
                const calleeType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(callee)));
                const parameterTypes = getParametersTypeUnionSubTypes(parserServices.esTreeNodeToTSNodeMap.get(node), args.length)(calleeType);
                args.forEach((argument, index) => {
                    if (argument.type === experimental_utils_1.AST_NODE_TYPES.Identifier) {
                        if (!targets.includes("identifier")) {
                            return;
                        }
                    }
                    else {
                        if (!targets.includes("lambda")) {
                            return;
                        }
                    }
                    const parameterTypeUnion = parameterTypes[index];
                    if (parameterTypeUnion == null ||
                        !parameterTypeUnion.every(isVoidFunctionType)) {
                        return;
                    }
                    const argumentType = checker.getApparentType(checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(argument)));
                    const argumentReturnTypeUnion = getReturnTypeUnionSubTypes(argumentType);
                    const argumentReturnsVoid = argumentReturnTypeUnion.every(isVoidType);
                    if (!argumentReturnsVoid) {
                        context.report({
                            node: argument,
                            messageId: "will-be-voided",
                        });
                    }
                });
            },
        };
    },
});
