const Rect = (props) => ({
  type: "RECT",
  x: props.x,
  y: props.y,
  z: props.z,
  width: props.width,
  height: props.height,
  onClick: props.onClick, // Must be tested
  children: props.children,
});

export default Rect;
