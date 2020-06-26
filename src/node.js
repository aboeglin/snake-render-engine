// Add setState // state ( see _node.js )
const Node = (fn) => (props) => (internalFeatures) =>
  fn(props || {}, internalFeatures);

module.exports = { Node };
