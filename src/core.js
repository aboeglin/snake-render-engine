const { curry } = require("ramda");
const { createClock } = require("./clock");

const traverse = curry((config, nodeResolver) => {
  const node = nodeResolver({ time: config.clock.getCurrentTime() });

  if (typeof node === "function") {
    return { children: [traverse(config, node)] };
  } else if (Array.isArray(node)) {
    return { children: node.map(traverse(config)) };
  } else if (node === undefined || node === null) {
    return {};
  }

  return {
    ...node,
    children: node.children ? node.children.map(traverse(config)) : [],
  };
});

const defaultConfig = {
  clock: createClock(Date.now),
};

// Remove clock param and mock the clock module for tests ? :s
// Or better, make a second opts param that is optional. Init a clock if none is given, same for the renderer maybe ?
const initWithRenderer = (renderer, config = defaultConfig) => {
  const start = (nodeElement) => {
    renderer(traverse(config, nodeElement));
    requestAnimationFrame(() => start(nodeElement));
  };

  return start;
};

module.exports = {
  traverse,
  initWithRenderer,
};
