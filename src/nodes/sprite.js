import { Node } from "../node";

const Sprite = Node((props) => ({
  type: "SPRITE",
  x: props.x,
  y: props.y,
  z: props.z,
  texture: props.texture,
  width: props.width,
  height: props.height,
  children: props.children,
}));

export default Sprite;
