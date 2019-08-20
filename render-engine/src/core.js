const traverse = nodeFn => {
  const node = nodeFn();

  if (typeof node === "function") {
    return traverse(node);
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
