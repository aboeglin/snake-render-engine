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

export const traverse = curry((config, subtree, nodeResolver) => {
  // TODO: time should be computed only once and passed to children. So most likely, start() should compute it.
  // Otherwise we would end up with different nodes having different times within the same render cycle.

  let resolverRef = null;
  if (subtree && subtree.__internal) {
    resolverRef = subtree.__internal.resolver;
  }

  const node = nodeResolver({
    time: config.clock.getCurrentTime(),
    mounted: config.lifecycles.mounted(resolverRef || nodeResolver),
    unmounted: config.lifecycles.unmounted(resolverRef || nodeResolver),
    setContext: (key, value) => {
      nodeResolver.context[key] = value;
    },
    getContext: (key) => nodeResolver.context[key],
  });

  if (!resolverRef) {
    resolverRef = nodeResolver;
  }

  if (typeof node === "function") {
    node.context = { ...nodeResolver.context, ...node.context };
    const child = subtree && subtree.children ? subtree.children[0] : undefined;
    return {
      children: [traverse(config, child, node)],
      __internal: { resolver: resolverRef },
    };
  } else if (Array.isArray(node)) {
    return {
      children: node.map((nr, i) => {
        const child = subtree ? subtree.children[i] : undefined;
        nr.context = { ...nr.context, ...nodeResolver.context };
        return traverse(config, child, nr);
      }),
      __internal: { resolver: resolverRef },
    };
  } else if (node === undefined || node === null) {
    return { __internal: { resolver: resolverRef } };
  }

  return {
    ...node,
    children: node.children
      ? node.children.map((nr, i) => {
          const child = subtree ? subtree.children[i] : undefined;
          nr.context = { ...nr.context, ...nodeResolver.context };
          return traverse(config, child, nr);
        })
      : [],
    __internal: { resolver: resolverRef },
  };
});

const defaultConfig = {
  clock: createClock(Date.now),
  lifecycles: makeLifecycles(),
};

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
