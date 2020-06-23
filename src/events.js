const { curry, forEach } = require("ramda");

// Add main event types and not only clicks:
// - mousemove
// - keydown
// - keyup
// ...
const handleEvent = curry((event, root) => {
  const minX = root.x;
  const maxX = root.x + root.width;
  const minY = root.y;
  const maxY = root.y + root.height;

  if (event.x > minX && event.x < maxX && event.y > minY && event.y < maxY) {
    root.onClick(event);
  } else {
    forEach(handleEvent(event))(root.children);
  }
});

module.exports = { handleEvent };