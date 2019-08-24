const traverse = nodeResolver => {
  const node = nodeResolver();

  if (typeof node === "function") {
    return { children: [traverse(node)] };
  } else if (Array.isArray(node)) {
    return { children: node.map(traverse) };
  } else if (node === undefined || node === null) {
    return {};
  }

  return {
    ...node,
    children: node.children ? node.children.map(traverse) : []
  };
};

const initWithRenderer = renderer => {
  const init = nodeElement => {
    renderer(traverse(nodeElement));
    requestAnimationFrame(() => init(nodeElement));
  };

  return init;
};

module.exports = {
  traverse,
  initWithRenderer
};
