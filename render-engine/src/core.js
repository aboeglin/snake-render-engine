const traverse = nodeFn => {
  const node = nodeFn();

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

module.exports = {
  traverse
};
