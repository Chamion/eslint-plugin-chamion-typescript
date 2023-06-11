# no-unique-object-comparison

> Disallow comparing objects that cannot identity equal anything by identity

The identity equality operation `===` where one side is an object evaluates to true only if the other side has the same identity.
A common mistake is to attempt to check for an empty object or array by comparing with an object or array expression.
This rule detects these errors.

## Examples

### Incorrect

```ts
a === {};
list.includes([]);
Array.prototype.indexOf.call(list, /a/);
Array.prototype.lastIndexOf.bind(list, {});
Object.is(a, (a = {}));
a !== (fn(), {});
a === new Class();
a === (() => {});
a === (function fn() {});
```

### Correct

```ts
typeof a === 'object' && a !== null && Object.keys(a).length === 0;
list.some(element => Array.isArray(element) && element.length === 0);
```

## When Not To Use It

If you cannot trust your types are correct to the point you'd get false positives disable this rule.
