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

const makeStuff = (initialState) => {
  let state = initialState;

  const setState = (x) => {
    state = x;
  };

  const getState = () => {
    console.log("getState", state);
    return state;
  };

  return {
    setState,
    getState,
  };
};

const stuff = makeStuff(50);

const withStuff = (node) => (props) => {
  return Node(() => node({ ...props, stuffInjected: stuff }));
};


const Container = Node(({ stuffInjected }) =>
  Rect({
    x: 320,
    y: stuffInjected.getState(),
    z: 0,
    width: 640,
    height: 100,
    onClick: () => stuffInjected.setState(stuffInjected.getState() + 10),
    children: [],
  })
);

const StuffedContainer = withStuff(Container);

const Scene = Node(() => StuffedContainer());

run(Scene());
