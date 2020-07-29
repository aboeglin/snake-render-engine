import SRE, {
  initRenderer,
  initWithRenderer,
  Rect,
  withClock,
  reconcile,
} from "sre";
import { dropLast, map, once, pipe } from "ramda";

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

const withDirection = (Node) => {
  const Direction = (
    props,
    { onGlobalKeyDown, state = Directions.UP, setState }
  ) => {
    onGlobalKeyDown((e) => {
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
  return Direction;
};

const getT0 = once((t) => t);

const INITIAL_TAIL = [{ x: 320, y: 0 }, { x: 320, y: -20 }, { x: 320, y: -40 }];
const Snake = (
  { time, direction },
  { setState, state = { tail: INITIAL_TAIL, ticks: 0 } }
) => {
  const currentTicks = pipe(
    (t) => t - getT0(t),
    (t) => Math.floor((t * Math.sqrt(state.tail.length)) / 1500)
  )(time);

  if (currentTicks > state.ticks) {
    // perform move:
    const firstPiece = state.tail[0];
    const middlePieces = dropLast(1, state.tail);
    const newTail = [{ x: 320, y: firstPiece.y + 20 }, ...middlePieces];
    setState({ tail: newTail, ticks: currentTicks });
  }

  return [...map(({ x, y }) => <TailPiece position={{ x, y }} />)(state.tail)];
};

const TailPiece = ({ position }, {}) => (
  <Rect x={position.x} y={position.y} z={0} width={18} height={18} />
);

const SnakeWithTime = withClock(Date.now, withDirection(Snake));

const Scene = () => <SnakeWithTime />;

run(<Scene />);
