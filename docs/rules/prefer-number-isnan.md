# prefer-number-isnan

> Disallows checking for NaN by self comparison

`NaN` is the only value that does not equal itself.
Therefore the expression `a !== a` is equivalent to `Number.isNaN(a)`.
The latter is much more readable and highlights mistakes if the intent was not to check for `NaN`.

## Examples

### Incorrect

```js
a === a;
a !== a;
```

### Correct

```js
Number.isNaN(a);
```

### Automatic Fixes

Any equality expression where both sides are the same identifier can be automatically replaced by a `Number.isNaN` call and a negation if needed.

## When Not To Use It

If you've need to use the more concise expression for minification purposes or prefer the self comparison disable this rule.
