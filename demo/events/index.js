import SRE, { initRenderer, initWithRenderer, Rect } from "sre";

const canvas = document.getElementById("canvas");
const height = canvas.height;
const width = canvas.width;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(canvas, render);

const Scene = () => (
  <Rect x={320} y={200} z={0} width={640} height={100} onClick={console.log} />
);

run(<Scene />);
