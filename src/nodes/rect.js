const Rect = (props) => ({
  type: "RECT",
  props: {
    x: props.x,
    y: props.y,
    z: props.z,
    width: props.width,
    height: props.height,
    onClick: props.onClick, // Must be tested
  },
  children: props.children,
});

Object.defineProperty(Rect, "_system", {
  value: true,
  configurable: true,
});

export default Rect;
