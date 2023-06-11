# react-no-stale-state

> Disallow referring to state in arguments of setState

A common problem in React components is referencing stale state which can lead to inconsistent state.
This rule detects all cases of stale state reference it can but the detection still needs some work.

## Examples

### Incorrect

```js
const [state, setState] = useState({ loading: false, value: null, error: null });
const onRequest = () => void setState({ ...state, loading: true, error: null });
```

### Correct

```js
const [state, setState] = useState({ loading: false, value: null, error: null });
const onRequest = () => void setState(prevState => ({ ...prevState, loading: true, error: null }));
```

## When Not To Use It

If you don't use React disable this rule.
