# no-assignment-expression

> Disallow use of assignments as expression

An assignment expression evaluates to the assigned value.
This can be confusing because the expression does multiple things.
This rule enforces the value of an assignment expression is never read.

## Examples

### Incorrect

```js
() => (i += 1);
```

### Correct

```js
() => (i += 1, i);
() => void (i += 1);
i += 1;
```

## When Not To Use It

If you prefer the conciseness of reading an assignment expression's value disable this rule.
