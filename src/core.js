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

// Find a way to hook event handler here ?
const initWithRenderer = (render, config = defaultConfig) => {
  const start = (nodeElement) => {
    render(traverse(config, nodeElement));
    requestAnimationFrame(() => start(nodeElement));
  };

  return start;
};

module.exports = {
  traverse,
  initWithRenderer,
};
