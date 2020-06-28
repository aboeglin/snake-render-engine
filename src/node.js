// Add setState // state ( see _node.js )
export const Node = (fn) => (props) => {
  const nodeResolver = (internalFeatures) => fn(props || {}, internalFeatures);

  nodeResolver.context = {};

  return nodeResolver;
};
