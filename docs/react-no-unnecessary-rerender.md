# react-no-stale-state

> Disallow calling state dispatch functions effect callbacks

A common antipattern in React code is setting state in response to state changes in a `useEffect` callback.
It's better to resolve state in one rerender to avoid unnecessary rerender although doing so requires more effort.

## Examples

### Incorrect

```js
const Component = () => {
  const [state, setState] = useState();
  useEffect(() => {
    if (state <= 0) {
      setState(1);
    }
  }, [state]);
  return null;
};
```

### Correct

```js
const Component = () => {
  const [state, setState] = useState();
  useEffect(() => {
    const callback = () => {
      setTimeout(() => {
        setState(1);
      }, 1000);
    };
    callback();
  }, [state]);
  return null;
};
```

## When Not To Use It

If you value agility over code quality or already have a messy codebase disable this rule to give developers greater freedom.
