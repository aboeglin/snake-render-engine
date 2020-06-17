const { Node } = require("../node");

const Rect = Node((props) => ({
  type: "RECT",
  x: props.x,
  y: props.y,
  z: props.z,
  width: props.width,
  height: props.height,
  children: props.children,
}));

module.exports = Rect;
