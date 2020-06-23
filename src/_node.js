const clickListeners = [];
global.onClick = fn => clickListeners.push(fn);
const click = event => clickListeners.forEach(l => l(event));

const createStore = reducer => {
  // Loads initial state by calling the reducer function with no state to get defaults
  let state = reducer(undefined, {});

  const getState = () => state;
  const dispatch = action => (state = reducer(state, action));

  return { getState, dispatch };
};

const initialState = { stuff: "Initial stuff" };
const reducer = (state = initialState, action) => {
  if (action.type === "NEW_STUFF_RECEIVED") {
    return {
      stuff: action.payload.stuff
    };
  }
  return state;
};

const store = createStore(reducer);

const traverse = nodeFn => {
  const node = nodeFn();

  const children =
    node.children && node.children.length ? node.children : false;

  // const spaces1 = Array(10 - nodeFn.name.length)
  //   .fill(" ")
  //   .join("");
  // const spaces2 = Array(10 - node.x.toString().length)
  //   .fill(" ")
  //   .join("");
  // const spaces3 = Array(20 - node.text.length)
  //   .fill(" ")
  //   .join("");

  // console.log(
  //   `${nodeFn.name}${spaces1}`,
  //   `x is: ${node.x}${spaces2}`,
  //   `text is: ${node.text}${spaces3}`,
  //   `${node.stuffFromStore}`
  // );
  // console.log(node, "\n");

  return {
    ...node,
    children: children ? children.map(traverse) : []
  };
};

const Node = fn => {
  const constructor = (props, initialState) => {
    let state = null;
    const setState = newState => (state = newState);

    const resolver = () => fn(props, state || initialState, setState, store);
    const name = constructor.displayName ? constructor.displayName : "Node";
    Object.defineProperty(resolver, "name", { value: name });

    return resolver;
  };

  return constructor;
};

const initialSceneState = { text: "Initial Text" };
const Scene = Node((props, state = initialSceneState, setState) => {
  return {
    x: props.x,
    text: state.text,
    children: [
      N1({ onStuffChanged: x => setState({ text: x+Math.random() }) }),
      N2({ x: 17, text: state.text })
    ]
  };
});
Scene.displayName = "Scene";

const N1 = Node((props, state, setState, store) => {
  setTimeout(() => props.onStuffChanged("New Text"), 1000);
  return {
    x: 5,
    text: "some text",
    children: []
  };
});
N1.displayName = "N1";

const N2 = Node((props, state, setState, store) => ({
  type: "N2",
  x: props.x,
  text: props.text,
  stuffFromStore: store.getState().stuff,
  onClick: console.log,
  children: [],
  _internal: true
}));
N2.displayName = "N2";

const s1 = Scene({ x: 99 });
const s2 = Scene({ x: 200 });

const dispatchClick = (currentTree, event) => {
  // Check depth ?
  // console.log(event, currentTree);
  if (currentTree._internal && currentTree.onClick) {
    currentTree.onClick(event);
    process.exit(0);
  }
  currentTree.children.forEach(child => dispatchClick(child, event));
};

const start = () => {
  let currentTree1 = null;
  let currentTree2 = null;

  global.onClick(event => dispatchClick(currentTree1, event));
  global.onClick(event => dispatchClick(currentTree2, event));

  setInterval(() => {
    console.clear();

    currentTree1 = traverse(s1);
    currentTree2 = traverse(s2);
    console.log(currentTree1.text);
    console.log(currentTree2.text);
  }, 2000);
};

start();

setTimeout(() => {
  store.dispatch({
    type: "NEW_STUFF_RECEIVED",
    payload: {
      stuff: "New stuff"
    }
  });
}, 3000);

setTimeout(() => {
  click("clicked");
}, 5000);
