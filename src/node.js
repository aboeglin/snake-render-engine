const Node = fn => props => () => fn(props || {});

module.exports = { Node };
