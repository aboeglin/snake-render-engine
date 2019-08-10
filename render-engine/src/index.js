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

const init = gl => {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

const render = root => {
  return root();
};

module.exports = {
  init,
  render,
  rect,
  circle
};
