import { curry, forEach } from "ramda";

const Events = {
  CLICK: "click",
  KEYPRESS: "keypress",
  UNKNOWN: "unknown",
};

// Add main event types and not only clicks:
// - mousemove
// - keydown
// - keyup
// ...
// TODO: Should probably check if root.type is one of the engine
// such as RECT, SPRITE, ...
export const handleEvent = curry((event, root) => {
  if (event.type === Events.CLICK) {
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
  } else if (event.type === Events.KEYPRESS) {
    if (root.onGlobalKeyPress) {
      root.onGlobalKeyPress(event);
    }

    forEach(handleEvent(event))(root.children);
  }
});

export const fromDOMEvent = curry((container, event) => {
  if (event.type === Events.CLICK) {
    return fromClickEvent(container, event);
  } else if (event.type === Events.KEYPRESS) {
    return fromKeyEvent(event);
  }
  return { type: Events.UNKNOWN };
});

const fromClickEvent = curry((container, event) => ({
  type: event.type,
  x: event.offsetX,
  y: container.clientHeight - event.offsetY,
}));

const fromKeyEvent = (event) => ({
  type: event.type,
  modifiers: [], // Should write test for handling this
  key: event.key,
  keyCode: event.keyCode,
});
