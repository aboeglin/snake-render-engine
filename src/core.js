import { contains, curry, forEach, pipe } from "ramda";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";

const defaultConfig = {
  clock: createClock(Date.now),
};

const Node = (type) => {
  let isMounted = false;
  let unmountedFn = null;
  let state = null;

  const setState = (newState) => {
    state = newState;
  };
  const getState = () => {
    return state;
  };

  const getType = () => type;

  const mounted = (fn) => {
    console.log("MOUNTED");
    if (!isMounted) {
      isMounted = true;
      fn();
    }
  };

  const unmounted = fn => {
    unmountedFn = fn;
  }

  const triggerUnmounted = () => {
    if (unmountedFn) {
      unmountedFn();
    }
  }

  return {
    setState,
    getState,
    getType,
    mounted,
    unmounted,
    triggerUnmounted,
  };
};

export const traverse = curry((config, oldNode, newNode) => {
  // Retrieve or create node instance
  if (oldNode && oldNode._instance && oldNode.type === newNode.type) {
    const i = oldNode._instance;
    newNode._instance = i;
  } else {
    const i = Node(newNode);
    newNode._instance = i;
  }

  // Compute the children of the newNode
  newNode.children = newNode._resolve({
    state: newNode._instance.getState(),
    setState: newNode._instance.setState,
    mounted: newNode._instance.mounted,
    unmounted: newNode._instance.unmounted,
  }) || [];

  // We wrap children that are single objects in arrays for consistency
  if (!Array.isArray(newNode.children) && typeof newNode.children === "object") {
    newNode.children = [newNode.children];
  }

  // Check for unmounted
  if (oldNode) {
    oldNode.children.forEach((oldChild, i) => {
      const newChild = newNode.children[i];
      if (oldChild && !newChild || newChild && newChild.type !== oldChild.type) {
        oldChild._instance.triggerUnmounted();
      }
    });
  }

  if (Array.isArray(newNode.children)) {
    // Arrays will definitely need some special attention !
    return {
      ...newNode,
      children: newNode.children.map((n, i) => {
        return traverse(config, oldNode && oldNode.children[i], n);
      }),
    };
  }

  return newNode;
});

export const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let tree = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    (event) => handleEvent(event, tree)
  );

  const start = (nodeElement) => {
    tree = traverse(config, tree, nodeElement);

    render(tree);
    requestAnimationFrame(() => start(nodeElement));
  };

  container.addEventListener("click", wireEvent);

  return start;
};
