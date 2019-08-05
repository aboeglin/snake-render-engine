const { curry } = require("ramda");

const rect = curry((props, children = []) => {
  return {
    type: "RECTANGLE",
    position: {
      x: props.x,
      y: props.y,
      z: props.z,
      width: props.width
    },
    children: children
  };
});

const circle = () => {};

const render = root => {
  return root();
};

module.exports = {
  render,
  rect,
  circle
};
