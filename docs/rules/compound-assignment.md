# compound-assignment

> Prefer compound or verbose assignment operators

This rule enforces a style choice between `a += b` and `a = a + b`.

## Configuration

Configure the rule to enforce your preferred pick between "compound" for `a += b` or "verbose" for `a = a + b`.

The following configuration enforces the verbose assignment style.

```json
{
  "prefer": "verbose"
}
```

The default behaviour is to prefer compound assignment.

## Examples

Depending on the configuration either the compound or verbose examples are incorrect.

### Compound

```js
a += b;
a &= 1;
```

### Verbose

```js
a = a + b;
a = a & 1;
```

## Automatic Fixes

Either style can be automatically replaced with the other.

### Interaction with increment-assignment

The the automatic fixes of the `increment-assignment` rule and this rule work together to transform expressions further where applicable.

If you've configured the `increment-assignment` rule to prefer update expressions and this rule to prefer compound assignments so `i = i + 1` will be transformed into `i++`.
Conversely if you've configured `increment-assignment` to prefer compound assignments and this rule to prefer verbose assignments `i++` will be transformed into `i = i + 1`.

## When Not To Use It

If you don't wish to enforce a style for reassignments disable this rule.
