// Add setState // state ( see _node.js )
const Node = (fn) => (props) => ({ time }) => fn(props || {}, time);

module.exports = { Node };
