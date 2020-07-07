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

// export const traverse = curry((config, subtree, nodeResolver) => {
//   // TODO: time should be computed only once and passed to children. So most likely, start() should compute it.
//   // Otherwise we would end up with different nodes having different times within the same render cycle.

//   let resolverRef = null;
//   if (subtree && subtree.__internal && subtree.__internal.owner === nodeResolver.owner) {
//     resolverRef = subtree.__internal.resolver;
//   }

//   const node = nodeResolver({
//     time: config.clock.getCurrentTime(),
//     mounted: config.lifecycles.mounted(resolverRef || nodeResolver),
//     unmounted: config.lifecycles.unmounted(resolverRef || nodeResolver),
//     setState: newState => { nodeResolver.state = newState; },
//     state: nodeResolver.state,
//     setContext: (key, value) => {
//       nodeResolver.context[key] = value;
//     },
//     getContext: (key) => nodeResolver.context[key],
//   });

//   if (!resolverRef) {
//     resolverRef = nodeResolver;
//   }

//   if (typeof node === "function") {
//     node.context = { ...nodeResolver.context, ...node.context };
//     const child = subtree && subtree.children ? subtree.children[0] : undefined;
//     return {
//       children: [traverse(config, child, node)],
//       __internal: { resolver: resolverRef, owner: nodeResolver.owner },
//     };
//   } else if (Array.isArray(node)) {
//     return {
//       children: node.map((nr, i) => {
//         const child = subtree ? subtree.children[i] : undefined;
//         nr.context = { ...nr.context, ...nodeResolver.context };
//         return traverse(config, child, nr);
//       }),
//       __internal: { resolver: resolverRef, owner: nodeResolver.owner },
//     };
//   } else if (node === undefined || node === null) {
//     return { __internal: { resolver: resolverRef, owner: nodeResolver.owner } };
//   }

//   return {
//     ...node,
//     children: node.children
//       ? node.children.map((nr, i) => {
//           const child = subtree ? subtree.children[i] : undefined;
//           nr.context = { ...nr.context, ...nodeResolver.context };
//           return traverse(config, child, nr);
//         })
//       : [],
//     __internal: { resolver: resolverRef, owner: nodeResolver.owner },
//   };
// });
export const traverse = curry((config, tree) => {

  const node = {
    children: tree.children,
    ...tree.__internal.resolver({
      time: config.clock.getCurrentTime(),
      mounted: config.lifecycles.mounted(tree.__internal.resolver),
      unmounted: config.lifecycles.unmounted(tree.__internal.resolver),
      state: tree.__internal.state,
      setState: tree.__internal.setState,
      // setContext: (key, value) => {
      //   nodeResolver.context[key] = value;
      // },
      // getContext: (key) => nodeResolver.context[key],
    }),
  };

  console.log(tree.__internal);

  if (typeof node === "function") {
    return {
      children: [traverse(config, child)],
      __internal: tree.__internal,
    };
  } else if (Array.isArray(node)) {
    return {
      children: node.map((n, i) => {
        return traverse(config, n);
      }),
      __internal: tree.__internal,
    };
  } else if (node === undefined || node === null) {
    return { __internal: tree.__internal };
  }

  return {
    ...node,
    children: node.children
      ? node.children.map((n, i) => {
          return traverse(config, n);
        })
      : [],
    __internal: tree.__internal,
  };
});

export const buildTree = curry((config, nodeResolver) => {
  // TODO: time should be computed only once and passed to children. So most likely, start() should compute it.
  // Otherwise we would end up with different nodes having different times within the same render cycle.

  // let resolverRef = null;
  // if (subtree && subtree.__internal && subtree.__internal.owner === nodeResolver.owner) {
  //   resolverRef = subtree.__internal.resolver;
  // }

  let state = {};

  const setState = (newState) => {
    console.log("setState", newState);
    state = newState;
  };

  const node = nodeResolver({
    time: config.clock.getCurrentTime(),
    mounted: config.lifecycles.mounted(nodeResolver),
    unmounted: config.lifecycles.unmounted(nodeResolver),
    setContext: (key, value) => {
      nodeResolver.context[key] = value;
    },
    getContext: (key) => nodeResolver.context[key],
    state,
    setState,
  });

  console.log(node);

  if (typeof node === "function") {
    node.context = { ...nodeResolver.context, ...node.context };
    return {
      children: [buildTree(config, node)],
      __internal: { resolver: nodeResolver, state, setState },
    };
  } else if (Array.isArray(node)) {
    return {
      children: node.map((nr, i) => {
        nr.context = { ...nr.context, ...nodeResolver.context };
        return buildTree(config, nr);
      }),
      __internal: { resolver: nodeResolver, state, setState },
    };
  } else if (node === undefined || node === null) {
    return { __internal: { resolver: nodeResolver, state, setState } };
  }

  return {
    ...node,
    children: node.children
      ? node.children.map((nr, i) => {
          nr.context = { ...nr.context, ...nodeResolver.context };
          return buildTree(config, nr);
        })
      : [],
    __internal: { resolver: nodeResolver, state, setState },
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

    if (tree === null) {
      tree = buildTree(config, nodeElement);
    }

    tree = traverse(config, tree);
    console.log(tree);

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
