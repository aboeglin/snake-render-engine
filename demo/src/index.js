const {
  initRenderer,
  initWithRenderer,
  Node,
  Rect,
} = require("../../src/index");

const canvas = document.getElementById("canvas");
const height = canvas.height;
const width = canvas.width;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(render);

const initialTime = Date.now();

const Scene = Node(() => {
  const dt = Date.now() - initialTime;

  return Rect({
    x: 320,
    y: (Math.sin(dt * .001) + 1) / 2 * 380 + 50,
    z: 0,
    width: 640,
    height: 100,
    children: [],
  })
});

run(Scene());
