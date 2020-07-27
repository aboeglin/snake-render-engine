import SRE, { initRenderer, initWithRenderer, Rect, withClock } from "sre";
import { once, pipe } from "ramda";

const canvas = document.getElementById("canvas");
const height = canvas.height;
const width = canvas.width;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(canvas, render);

const Directions = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
};

const withDirection = Node => (props, { onGlobalKeyDown, state = Directions.UP, setState }) => {
  onGlobalKeyDown(e => {
    if (e.key === "ArrowDown" && state !== Directions.UP) {
      setState(Directions.DOWN);
    } else if (e.key === "ArrowUp" && state !== Directions.DOWN) {
      setState(Directions.UP);
    } else if (e.key === "ArrowLeft" && state !== Directions.RIGHT) {
      setState(Directions.LEFT);
    } else if (e.key === "ArrowRight" && state !== Directions.LEFT) {
      setState(Directions.RIGHT);
    }
  });

  return <Node {...props} direction={state} />;
};

const getT0 = once((t) => t);


const Snake = ({ time, direction }, { setState, state = { tailLength: 3 } }) =>{
  console.log(direction);
  return pipe(
    (t) => t - getT0(t),
    (t) => Math.floor((t * Math.sqrt(state.tailLength)) / 1500) * 20,
    (y) =>
      new Array(state.tailLength)
        .fill({})
        .map((_, i) => <TailPiece position={{ x: 320, y: y - i * 20 }} />)
  )(time)};

const TailPiece = ({ position }) => (
  <Rect x={position.x} y={position.y} z={0} width={18} height={18} />
);

const SnakeWithTime = withClock(Date.now, withDirection(Snake));

const Scene = () => <SnakeWithTime />;

run(<Scene />);
