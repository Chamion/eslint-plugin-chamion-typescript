# explicit-void-return

> Disallow returning void implicitly

Returning an expression that evaluates to undefined can be confusing or lead to defects.
This rule enforces returned expressions are explicitly voided.

## Examples

### Incorrect

```ts
() => console.log('message');
() => {
  return console.log('message');
}
```

### Correct

```ts
() => void console.log('message');
() => {
  console.log('message');
};
```

## Automatic Fixes

The rule suggests applying the void operator to the returned expression like in the first correct example.
This operation is not automatically applied because there are sometimes better alternatives like the second correct example.

## When Not To Use It

If you cannot trust your type annotations to the point you'd get false positives disable this rule.
