"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createArrowBody = (context) => {
    const EXPRESSIONS_WITHOUT_PARENTHESES = [
        "CallExpression",
        "UnaryExpression",
        "ThisExpression",
        "AwaitExpression",
        "ArrayExpression",
        "Literal",
        "MemberExpression",
        "NewExpression",
        "UpdateExpression",
    ];
    let single = (context.options[0] || {}).single;
    if (single == null)
        single = "void";
    let multi = (context.options[0] || {}).multi;
    if (multi == null)
        multi = "void";
    const lintVoid = (node, scope) => {
        const { body: block } = node;
        if (block.type !== "BlockStatement" ||
            block.body.length === 0 ||
            (scope === "single" && block.body.length > 1) ||
            (scope === "multi" && block.body.length === 1) ||
            !block.body.every((expressionStatement) => expressionStatement.type === "ExpressionStatement"))
            return;
        const fix = (fixer) => {
            const source = context.getSourceCode();
            let expressionsReplacement = block.body
                .map(({ expression }) => source.getText(expression))
                .join(", ");
            if (block.body.length > 1 ||
                !EXPRESSIONS_WITHOUT_PARENTHESES.includes(block.body[0].expression.type)) {
                expressionsReplacement = `(${expressionsReplacement})`;
            }
            const replacement = `void ${expressionsReplacement}`;
            return fixer.replaceText(block, replacement);
        };
        const hasComments = context.getSourceCode().getCommentsInside(block).length > 0;
        context.report({
            node: block,
            message: "Unexpected function body. Use void instead.",
            fix: hasComments ? null : fix,
            suggest: [
                {
                    desc: "Replace with void expression.",
                    fix,
                },
            ],
        });
    };
    const lintBody = (node, scope) => {
        const { body: voidExpression } = node;
        if (voidExpression.type !== "UnaryExpression" ||
            voidExpression.operator !== "void" ||
            (scope === "single" &&
                voidExpression.argument.type === "SequenceExpression") ||
            (scope === "multi" &&
                voidExpression.argument.type !== "SequenceExpression"))
            return;
        const expressions = voidExpression.argument.type === "SequenceExpression"
            ? voidExpression.argument.expressions
            : [voidExpression.argument];
        if (!expressions.every((expression) => SIMPLE_SIDE_EFFECT_EXPRESSIONS.includes(expression.type)))
            return;
        const fix = (fixer) => {
            const source = context.getSourceCode();
            const expressionsReplacement = expressions
                .map((expression) => source.getText(expression))
                .join(";");
            const replacement = `{${expressionsReplacement};}`;
            return fixer.replaceText(voidExpression, replacement);
        };
        const hasComments = context.getSourceCode().getCommentsInside(voidExpression).length > 0;
        context.report({
            node: voidExpression,
            message: "Unexpected void operator. Use function body instead.",
            fix: hasComments ? null : fix,
            suggest: [
                {
                    desc: "Replace with function body.",
                    fix,
                },
            ],
        });
    };
    return {
        ArrowFunctionExpression: (node) => {
            if (single === "void")
                lintVoid(node, "single");
            else if (single === "body")
                lintBody(node, "single");
            if (multi === "void")
                lintVoid(node, "multi");
            else if (multi === "body")
                lintBody(node, "multi");
        },
    };
};
exports.default = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer void operator or function body in void arrow function return values.",
            suggestion: true,
            recommended: false,
            extendsBaseRule: false,
            requiresTypeChecking: false,
        },
        hasSuggestions: true,
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    single: {
                        enum: ["void", "body", false],
                    },
                    multi: {
                        enum: ["void", "body", false],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [],
    create: createArrowBody
};
