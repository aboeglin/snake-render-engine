const Rect = props => ({
  type: "RECTANGLE",
  position: {
    x: props.x,
    y: props.y,
    z: props.z,
    width: props.width
  },
  children: props.children
});

module.exports = Rect;
