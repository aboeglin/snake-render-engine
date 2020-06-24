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
const run = initWithRenderer(canvas, render);

const initialTime = Date.now();

// const Scene = Node(() => {
//   const dt = Date.now() - initialTime;

//   return Rect({
//     x: 320,
//     y: 50, //(Math.sin(dt * .001) + 1) / 2 * 380 + 50,
//     z: 0,
//     width: 640,
//     height: 100,
//     onClick: console.log,
//     children: [],
//   })
// });

// run(Scene());

run(
  Rect({
    x: 320,
    y: 50, //(Math.sin(dt * .001) + 1) / 2 * 380 + 50,
    z: 0,
    width: 640,
    height: 100,
    onClick: console.log,
    children: [],
  })
);
