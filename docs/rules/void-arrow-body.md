# void-arrow-body

> Prefer void operator or function body in void arrow function return values

## Configuration

The rule can be configured to enforce a style for single-expression function bodies, multi-expression function bodies or both.

The following configuration enforces a void style for single-expression function bodies and does not enforce a style for multi-expression function bodies.

```json
{
  "single": "void",
  "multi": false
}
```

The following configuration enforces a body block style for all void functions.

```json
{
  "single": "body",
  "multi": "body"
}
```

## Examples

The rule works both ways so depending on your configuration which examples are correct or incorrect may be flipped.
Configuring the rule to prefer void expressions makes the body examples incorrect and configuring to prefer body blocks makes the void examples incorrect.

### Void

#### Single Void

```js
() => void sideEffect();
```

#### Multi Void

```js
() => void (
  i += 1,
  sideEffect()
);
```

### Body

#### Single Body

```js
() => { sideEffect(); }
```

#### Multi Body

```js
() => void {
  i += 1;
  sideEffect();
};
```

## Automatic Fixes

Both styles can be automatically transformed to the other by applying the automatic fix.

## When Not To Use It

If you don't want to enforce a style for void functions disable this rule.
