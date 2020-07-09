import { contains, curry, forEach, pipe } from "ramda";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";

const makeLifecycles = () => {
  let mountedResolvers = [];
  const mounted = curry((resolver, handler) => {
    resolver.mountedHandler = handler;
    mountedResolvers.push(resolver);
  });

  let unmountedResolvers = [];
  const unmounted = curry((resolver, handler) => {
    resolver.unmountedHandler = handler;
    unmountedResolvers.push(resolver);
  });

  const reset = () => {
    mountedResolvers = [];
    unmountedResolvers = [];
  };

  const getResolvers = () => ({
    mountedResolvers,
    unmountedResolvers,
  });

  return {
    mounted,
    unmounted,
    __getResolvers: getResolvers,
    __reset: reset,
  };
};

const defaultConfig = {
  clock: createClock(Date.now),
  lifecycles: makeLifecycles(),
};

const Node = (type) => {
  let state = null;
  const setState = (newState) => {
    state = newState;
  };
  const getState = () => {
    return state;
  };
  const getType = () => type;
  return {
    setState,
    getState,
    getType,
  };
};

export const traverse = curry((config, oldNode, newNode) => {
  if (!newNode) {
    newNode = {
      children: [],
    };
  }

  if (oldNode && oldNode._instance) {
    const i = oldNode._instance;
    newNode._instance = i;
  } else {
    const i = Node(newNode);
    newNode._instance = i;
  }

  newNode.children = newNode._resolve({
    state: newNode._instance.getState(),
    setState: newNode._instance.setState,
  });

  if (typeof newNode === "function") {
    return {
      ...newNode,
      children: [traverse(config, oldNode && oldNode.children, newNode)],
    };
  } else if (Array.isArray(newNode.children)) {
    // Arrays will definitely need some special attention !
    return {
      ...newNode,
      children: newNode.children.map((n, i) => {
        return traverse(config, oldNode && oldNode.children[i], n);
      }),
    };
  } else if (typeof newNode.children === "object") {
    return {
      ...newNode,
      children: [traverse(config, oldNode && oldNode.children, newNode.children)],
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
    const prevResolvers = config.lifecycles.__getResolvers();
    config.lifecycles.__reset();

    tree = traverse(config, tree, nodeElement);

    const currResolvers = config.lifecycles.__getResolvers();

    handleLifecycles(prevResolvers, currResolvers);

    render(tree);
    requestAnimationFrame(() => start(nodeElement));
  };

  container.addEventListener("click", wireEvent);

  return start;
};

const handleLifecycles = (prevResolvers, currResolvers) => {
  forEach(
    (r) => !contains(r)(prevResolvers.mountedResolvers) && r.mountedHandler()
  )(currResolvers.mountedResolvers);
  forEach(
    (r) =>
      !contains(r)(currResolvers.unmountedResolvers) && r.unmountedHandler()
  )(prevResolvers.unmountedResolvers);
};
