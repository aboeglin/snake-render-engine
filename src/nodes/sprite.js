// TODO: Should add events ?
const Sprite = props => ({
  type: "SPRITE",
  x: props.x,
  y: props.y,
  z: props.z,
  texture: props.texture,
  width: props.width,
  height: props.height,
  children: props.children,
});

Object.defineProperty(Sprite, "_system", {
  value: true,
  configurable: true,
});

export default Sprite;
