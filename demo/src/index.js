const {
  initRenderer,
  initWithRenderer,
  Node,
  Rect,
} = require("../../src/index");

const canvas = document.getElementById("canvas");
const height = canvas.clientHeight;
const width = canvas.clientWidth;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(render);

const Scene = Node(() =>
  Rect({
    x: 72,
    y: 39,
    z: 0,
    width: 80,
    height: 14,
    children: [],
  })
);

run(Scene());
