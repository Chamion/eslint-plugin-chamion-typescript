# react-no-unnecessary-rerender

> Disallow calling state dispatch functions in effect callbacks

A common antipattern in React code is setting state in response to state changes in a `useEffect` callback.
It's better to resolve state in one rerender to avoid unnecessary rerender although doing so requires more effort.

## Examples

### Incorrect

```js
const DerivedFromProps = ({ config, value }) => {
  const [state, setState] = useState(() => calculateState(config, value, 0));
  useEffect(() => {
    setState(calculateState(config, value, 0));
  }, [config, value]);
  // ...
};

const RespondingToEvent = () => {
  const [data, setData] = useState(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setData(null);
    let cancelled = false;
    loadData(index).then((response) => {
      if (!cancelled) setData(response.data);
    });
    return () => (cancelled = true);
  }, [index]);
  const handleIndexChange = (event) => setIndex(event.target.value);
  // ...
};
```

### Correct

```js
const DerivedFromProps = ({ config, value }) => {
  const [index, setIndex] = useState(0);
  const state = calculateState(config, value, index);
  // ...
};

const RespondingToEvent = () => {
  const [data, setData] = useState(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(index);
  indexRef.current = index;
  const handleIndexChange = (event) => {
    const newIndex = event.target.value;
    setIndex(newIndex);
    setData(null);
    loadData(newIndex).then((response) => {
      if (indexRef.current === newIndex) setData(response.data);
    });
  };
  // ...
};
```

## When Not To Use It

If you value agility over code quality or already have a messy codebase disable this rule to give developers greater freedom.
