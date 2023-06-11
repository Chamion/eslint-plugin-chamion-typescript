# prefer-flatmap

> Prefer Array.prototype.flatMap over Array.prototype.reduce where applicable

Before `Array.prototype.flatMap` was introduced the functional style of combining a filter and a map was to use `Array.prototype.reduce` to build an array.
This involves copying the accumulator array on each iteration which can be a performance issue.
`Array.prototype.flatMap` offers a more readable and performant way to express the same operation.

## Examples

### Incorrect

```js
const evenSizes = list => list.reduce(
  (acc, element) => element.size & 1 ? acc : [...acc, element.size],
  []
);
```

### Correct

```js
const evenSizes = list => list.flatMap(
  (element) => element.size & 1 ? [] : [element.size]
);
```

## When Not To Use It

If you don't agree the `Array.prototype.flatMap` usage is more readable or cannot use it in your execution environment disable this rule.
