# narrowing-type-predicates

This rule enforces correct usage of the narrowing type predicate pattern.
Type constraints in return values must match the parameter and return types.
If the types do not match this rule will report them as problems and automatically change the constraints to match the function signature.

## Examples

### Incorrect

```ts
const predicate = (value: A): value is B => {
  if (value.type === 'B') return (value satisfies C, true);
  else return (value satisfies Exclude<A, B>, false);
}

const isPositive = (value: -1 | 0 | 1 | 2): value is 1 | 2 => {
  if (value > 0) return (value satisfies 1 | 2, true);
  else return (value satisfies Exclude<number, 1 | 2>, false);
}

const autoFillUseCase = (value: A): value is B => {
  if (value.type === 'B') return (value satisfies placeholder, true);
  else return (value satisfies Exclude<placeholder, placeholder>, false);
}
```

### Correct

The above incorrect code can be automatically fixed to these correct examples

```ts
const predicate = (value: A): value is B => {
  if (value.type === 'B') return (value satisfies B, true);
  else return (value satisfies Exclude<A, B>, false);
}

const isPositive = (value: -1 | 0 | 1 | 2): value is 1 | 2 => {
  if (value > 0) return (value satisfies 1 | 2, true);
  else return (value satisfies Exclude<-1 | 0 | 1 | 2, 1 | 2>, false);
}

const autoFillUseCase = (value: A): value is B => {
  if (value.type === 'B') return (value satisfies B, true);
  else return (value satisfies Exclude<A, B>, false);
}
```

## When Not To Use It

If you're not using the narrowing type predicates pattern disable this rule.
