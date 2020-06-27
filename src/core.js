const { __, contains, curry, forEach, pipe } = require("ramda");
const { createClock } = require("./clock");
const { handleEvent, fromDOMEvent } = require("./events");

const makeLifecycles = () => {
  let mountedHandlers = [];
  const mounted = (handler) => {
    mountedHandlers.push(handler);
  };

  let unmountedHandlers = [];
  const unmounted = (handler) => {
    unmountedHandlers.push(handler);
  };

  const reset = () => {
    mountedHandlers = [];
    unmountedHandlers = [];
  };

  const getHandlers = () => ({
    mountedHandlers,
    unmountedHandlers,
  });

  return {
    mounted,
    unmounted,
    __getHandlers: getHandlers,
    __reset: reset,
  };
};

const traverse = curry((config, nodeResolver) => {
  // TODO: time should be computed only once and passed to children. So most likely, start() should compute it.
  // Otherwise we would end up with different nodes having different times within the same render cycle.
  const node = nodeResolver({
    time: config.clock.getCurrentTime(),
    mounted: config.lifecycles.mounted,
    unmounted: config.lifecycles.unmounted,
    setContext: (key, value) => {
      nodeResolver.context[key] = value;
    },
    context: nodeResolver.context,
  });

  if (typeof node === "function") {
    node.context = { ...nodeResolver.context, ...node.context };
    return { children: [traverse(config, node)] };
  } else if (Array.isArray(node)) {
    return {
      children: node.map((nr) => {
        nr.context = { ...nr.context, ...nodeResolver.context };
        return traverse(config, nr);
      }),
    };
  } else if (node === undefined || node === null) {
    return {};
  }

  return {
    ...node,
    children: node.children
      ? node.children.map((nr) => {
          nr.context = { ...nr.context, ...nodeResolver.context };
          return traverse(config, nr);
        })
      : [],
  };
});

const defaultConfig = {
  clock: createClock(Date.now),
  lifecycles: makeLifecycles(),
};

const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let vdom = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    (event) => handleEvent(event, vdom)
  );

  const start = (nodeElement) => {
    const prevHandlers = config.lifecycles.__getHandlers();
    config.lifecycles.__reset();

    vdom = traverse(config, nodeElement);

    const handlers = config.lifecycles.__getHandlers();

    handleLifecycles(prevHandlers, handlers);

    render(vdom);
    requestAnimationFrame(() => start(nodeElement));
  };

  container.addEventListener("click", wireEvent);

  return start;
};

const handleLifecycles = (prevHandlers, currHandlers) => {
  forEach((h) => !contains(h)(prevHandlers.mountedHandlers) && h())(
    currHandlers.mountedHandlers
  );
  forEach((h) => !contains(h)(currHandlers.unmountedHandlers) && h())(
    prevHandlers.unmountedHandlers
  );
};

module.exports = {
  traverse,
  initWithRenderer,
};
