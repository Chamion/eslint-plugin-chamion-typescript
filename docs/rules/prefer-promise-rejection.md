# prefer-promise-rejection

> Disallow throwing in a function that always returns a promise

Async functions usually return a rejecting promise instead of throwing an error.
It's easy to accidentally throw a promise where one meant to reject a promise.
This rule detects such mistakes.

## Examples

### Incorrect

```js
(input) => {
  if (input.id == null) {
    throw new Error('Missing ID');
  }
  return createPromise(input);
}
```

### Correct

```js
async (input) => {
  if (input.id == null) {
    throw new Error('Missing ID');
  }
  return createPromise(input);
}

(input) => {
  if (input.id == null) {
    return Promise.reject(new Error('Missing ID'));
  }
  return createPromise(input);
}
```

## When Not To Use It

If you've reason to throw in a function that returns a promise disable this rule.
