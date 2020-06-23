const Node = (fn) => (props) => ({ time }) => fn(props || {}, time);

module.exports = { Node };
