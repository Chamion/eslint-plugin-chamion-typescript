# void-side-effect

> Disallow void operator on non-side-effect arguments

A void expression always evaluates to `undefined` therefore the only difference between void expressions are the side effects they have.
If a void expression has no side effects it's equivalent to `undefined`, which is simpler.

## Examples

### Incorrect

```js
void 0;
void (() => {});
```

### Correct

```js
void fn();
```

## When Not To Use It

If you need to avoid redefined `undefined` or wish to minify code with the more concise `void 0`, disable this rule.
If you wish to ban the use of the void operator entirely enable `no-void` instead.
