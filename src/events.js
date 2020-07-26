import { curry, forEach } from "ramda";

const Events = {
  CLICK: "click",
  KEYPRESS: "keypress",
  KEYDOWN: "keydown",
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
    const minX = root.props.x - root.props.width / 2;
    const maxX = minX + root.props.width;
    const minY = root.props.y - root.props.height / 2;
    const maxY = minY + root.props.height;

    if (
      event.x >= minX &&
      event.x <= maxX &&
      event.y >= minY &&
      event.y <= maxY
    ) {
      if (root.props.onClick) {
        root.props.onClick(event);
      }
    } else {
      forEach(handleEvent(event))(root.children);
    }
  } else {
    // TODO: _instance is not defined for _system nodes such as Rect, add test for that
    if (event.type === Events.KEYPRESS && root._instance && root._instance.getGlobalKeyPressHandler()) {
      root._instance.getGlobalKeyPressHandler()(event);
    } else if (event.type === Events.KEYDOWN && root._instance && root._instance.getGlobalKeyDownHandler()) {
      root._instance.getGlobalKeyDownHandler()(event);
    }

    forEach(handleEvent(event))(root.children);
  }
});

export const fromDOMEvent = curry((container, event) => {
  if (event.type === Events.CLICK) {
    return fromClickEvent(container, event);
  } else if (event.type === Events.KEYPRESS || event.type === Events.KEYDOWN) {
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
