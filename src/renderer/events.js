const { curry, forEach } = require("ramda");

// Should have a mechanism either to traverse the tree and root should be the non traversed tree, or acess the
// latest version of the traversed tree.
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
