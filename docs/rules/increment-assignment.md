# increment-assignment

> Prefer compound assignment or increment shorthand

This rule enforces a style decision between `i += 1` and `i++`.

## Configuration

Configure the rule to enforce your preferred style. "compound" for "i += 1" or "update" for `i++`.

The following configuration enforces the compound assignment style is used.

```json
{
  "prefer": "compound"
}
```

## Examples

Depending on your configuration either the compound assignment or update expression style is incorrect.

### Compound Assignment

```js
i += 1;
i -= 1;
```

### Update Expression

```js
i++;
i--;
```

## Automatic Fixes

Both styles can be automatically replaced with the other.

## When Not To Use It

If you don't wish to enforce a particular style of incrementing disable this rule.
