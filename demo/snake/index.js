import SRE, { initRenderer, initWithRenderer, Rect, withClock } from "sre";
import { once, pipe } from "ramda";

const canvas = document.getElementById("canvas");
const height = canvas.height;
const width = canvas.width;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(canvas, render);

const getT0 = once((t) => t);

const Snake = ({ time }, { setState, state = { tailLength: 3 } }) =>
  pipe(
    (t) => t - getT0(t),
    (t) => Math.floor((t * Math.sqrt(state.tailLength)) / 1500) * 20,
    (y) =>
      new Array(state.tailLength)
        .fill({})
        .map((_, i) => <TailPiece position={{ x: 320, y: y - i * 20 }} />)
  )(time);

const TailPiece = ({ position }) => (
  <Rect x={position.x} y={position.y} z={0} width={18} height={18} />
);

const SnakeWithTime = withClock(Date.now, Snake);

const Scene = () => <SnakeWithTime />;

run(<Scene />);
