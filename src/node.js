// Add setState // state ( see _node.js )
const Node = (fn) => (props) => {
  const nodeResolver = (internalFeatures) => fn(props || {}, internalFeatures);

  nodeResolver.context = {};

  return nodeResolver;
};

module.exports = { Node };
