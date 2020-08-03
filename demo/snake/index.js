import SRE, {
  initRenderer,
  initWithRenderer,
  Rect,
  withClock,
  enhance,
} from "sre";
import { dropLast, map, once, pipe, reverse } from "ramda";

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

const getT0 = once((t) => t);

const INITIAL_TAIL = [{ x: 320, y: 0 }, { x: 320, y: -20 }, { x: 320, y: -40 }];

const deriveTail = enhance(
  (
    {
      onGlobalKeyDown,
      setState,
      state = {
        tail: INITIAL_TAIL,
        ticks: 0,
        direction: Directions.UP,
        wishedDirection: Directions.UP,
      },
    },
    props
  ) => {
    onGlobalKeyDown((e) => {
      if (state.direction === state.wishedDirection) {
        if (e.key === "ArrowDown" && state.wishedDirection !== Directions.UP) {
          setState({ ...state, wishedDirection: Directions.DOWN });
        } else if (
          e.key === "ArrowUp" &&
          state.wishedDirection !== Directions.DOWN
        ) {
          setState({ ...state, wishedDirection: Directions.UP });
        } else if (
          e.key === "ArrowLeft" &&
          state.wishedDirection !== Directions.RIGHT
        ) {
          setState({ ...state, wishedDirection: Directions.LEFT });
        } else if (
          e.key === "ArrowRight" &&
          state.wishedDirection !== Directions.LEFT
        ) {
          setState({ ...state, wishedDirection: Directions.RIGHT });
        }
      }
    });

    const currentTicks = pipe(
      (t) => t - getT0(t),
      (t) => Math.floor((t * Math.sqrt(state.tail.length)) / 300)
    )(props.time);

    if (currentTicks > state.ticks) {
      // perform move:
      const firstPiece = state.tail[0];
      const middlePieces = dropLast(1, state.tail);
      let newX = firstPiece.x;
      let newY = firstPiece.y;
      if (state.wishedDirection === Directions.LEFT) {
        newX = newX - 20;
      } else if (state.wishedDirection === Directions.RIGHT) {
        newX = newX + 20;
      }
      if (state.wishedDirection === Directions.UP) {
        newY = newY + 20;
      } else if (state.wishedDirection === Directions.DOWN) {
        newY = newY - 20;
      }

      const newTail = [{ x: newX, y: newY }, ...middlePieces];
      setState({
        ...state,
        tail: newTail,
        ticks: currentTicks,
        direction: state.wishedDirection,
      });
    }
    return state.tail;
  }
);

const pipeEnhancers = (...args) => pipe(...reverse(args));

const withTail = pipeEnhancers(
  withClock(Date.now)("time"),
  deriveTail("tail")
);

const Snake = ({ tail }) =>
  map(({ x, y }) => <TailPiece position={{ x, y }} />)(tail);

const TailPiece = ({ position }) => (
  <Rect x={position.x} y={position.y} z={0} width={18} height={18} />
);

const EnhancedSnake = withTail(Snake);

const Scene = () => <EnhancedSnake />;

run(<Scene />);
