import { curry, forEach } from "ramda";

// Add main event types and not only clicks:
// - mousemove
// - keydown
// - keyup
// ...
// TODO: Should probably check if root.type is one of the engine
// such as RECT, SPRITE, ...
export const handleEvent = curry((event, root) => {
  const minX = root.x - root.width / 2;
  const maxX = minX + root.width;
  const minY = root.y - root.height / 2;
  const maxY = minY + root.height;

  if (
    event.x >= minX &&
    event.x <= maxX &&
    event.y >= minY &&
    event.y <= maxY
  ) {
    if (root.onClick) {
      root.onClick(event);
    }
  } else {
    forEach(handleEvent(event))(root.children);
  }
});

export const fromDOMEvent = curry((container, event) => ({
  x: event.offsetX,
  y: container.clientHeight - event.offsetY,
  type: event.type,
}));
