# no-return-into-void

> Disallow returning a value in a function whose return value is voided

Returning a value in a function that is assigned a void function type is confusing.
The return value will be voided which may be intentional or not.
This rule enforces the return values be explicitly voided when that is the intent.

## Configuration

Enforcement can be limited to only function expressions inlined in function call arguments or expanded to include functions passed as identifiers as well.
The configuration property `"targets"` is a list of expression types that should be included in enforcement.

The following configuration targets both inline lambdas and functions bound to a variable.

```json
{
  "targets": ["lambda", "identifier"]
}
```

The default behaviour is to only target lambdas.

## Examples

### Incorrect

```js
['str'].forEach(element => (acc += element));
['str'].forEach(element => {
  console.log(element);
  return null;
});

// Only incorrect if "identifier" is in configuration targets
const log = obj => {
  console.log(obj);
  return null;
};
['str'].forEach(log);
```

### Correct

```js
['str'].forEach(element => void (acc += element));
['str'].forEach(element => {
  console.log(element);
});

const log = obj => {
  console.log(obj);
  return null;
};
['str'].forEach((...params) => void log(...params));
```

## When Not To Use It

If you don't find returning a value into the void confusing disable this rule.
