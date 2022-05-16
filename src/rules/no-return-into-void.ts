import {
  AST_NODE_TYPES,
  ESLintUtils,
} from "@typescript-eslint/experimental-utils";
import { unionTypeParts } from "tsutils";
import { Type, Node } from "typescript";

const { getParserServices } = ESLintUtils;
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Chamion/eslint-plugin-chamion-typescript/blob/master/docs/rules/${name}.md`
);

const isFunctionType = (type: Type): boolean =>
  unionTypeParts(type).every(
    (typePart) => typePart.getCallSignatures().length > 0
  );

const voidTypeNames = ["undefined", "void"];
const isVoidType = (type: Type): boolean => {
  const { intrinsicName } =  type as { intrinsicName?: string };
  return intrinsicName != null && voidTypeNames.includes(intrinsicName);
};

export default createRule({
  name: "no-return-into-void",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow returning a value in a function whose return value is voided.",
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

    const getReturnTypeUnionSubTypes = (type: Type): Type[] =>
      unionTypeParts(type)
        .flatMap((subType) => subType.getCallSignatures())
        .map((signature) => signature.getReturnType())
        .flatMap((returnType) => unionTypeParts(returnType));
    const getParametersTypeUnionSubTypes =
      (node: Node, length: number) =>
      (type: Type): Type[][] => {
        const parametersOfCallSignatures = unionTypeParts(type)
          .flatMap((subType) => subType.getCallSignatures())
          .map((signature) => signature.getParameters())
          .filter((parameters) => parameters.length === length);
        if (parametersOfCallSignatures.length === 0) {
          return [];
        }
        const parameters = parametersOfCallSignatures[0].map((_, index) =>
          parametersOfCallSignatures.map(
            (callSignatureParameters) => callSignatureParameters[index]
          )
        );
        return parameters.map((parameters) =>
          parameters.map((parameter) =>
            checker.getApparentType(
              checker.getTypeOfSymbolAtLocation(parameter, node)
            )
          )
        );
      };
    const isVoidFunctionType = (type: Type): boolean =>
      isFunctionType(type) &&
      getReturnTypeUnionSubTypes(type).every(isVoidType);

    return {
      CallExpression: (node): void => {
        const { callee, arguments: args } = node;
        const calleeType = checker.getApparentType(
          checker.getTypeAtLocation(
            parserServices.esTreeNodeToTSNodeMap.get(callee)
          )
        );
        const parameterTypes = getParametersTypeUnionSubTypes(
          parserServices.esTreeNodeToTSNodeMap.get(node),
          args.length
        )(calleeType);
        args.forEach((argument, index) => {
          if (argument.type === AST_NODE_TYPES.Identifier) {
            if (!targets.includes("identifier")) {
              return;
            }
          } else {
            if (!targets.includes("lambda")) {
              return;
            }
          }
          const parameterTypeUnion = parameterTypes[index];
          if (
            parameterTypeUnion == null ||
            !parameterTypeUnion.every(isVoidFunctionType)
          ) {
            return;
          }
          const argumentType = checker.getApparentType(
            checker.getTypeAtLocation(
              parserServices.esTreeNodeToTSNodeMap.get(argument)
            )
          );
          const argumentReturnTypeUnion =
            getReturnTypeUnionSubTypes(argumentType);
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
