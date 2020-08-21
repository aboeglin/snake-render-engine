import SRE, {
  initRenderer,
  initWithRenderer,
  Rect,
  onGlobalKeyDown,
  withStore,
  makeStore,
} from "sre";

import {
  append,
  assoc,
  cond,
  curry,
  dropLast,
  last,
  map,
  objOf,
  pipe,
  propEq,
  propOr,
  when,
} from "ramda";

const canvas = document.getElementById("canvas");
const width = canvas.width;
const height = canvas.height;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(canvas, render);

const Directions = Object.freeze({
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
});

const generateRandomPosition = (random) =>
  pipe(
    (r) => ({ x: r() * (width - 20), y: r() * (height - 20) }), // generateRandom
    map(
      pipe(
        Math.ceil,
        (x) => x - (x % 20) + 10
      )
    )
  )(random);

const INITIAL_TAIL = [
  { x: 310, y: 30 },
  { x: 310, y: 10 },
  { x: 310, y: -10 },
];
const INITIAL_STATE = {
  tail: INITIAL_TAIL,
  direction: Directions.UP,
  wishedDirection: Directions.UP,
  apple: generateRandomPosition(Math.random),
};

const computeMove = curry((direction, tail) =>
  pipe(
    objOf("d"),
    assoc("h", tail[0]),
    cond([
      [propEq("d", Directions.LEFT), ({ h }) => ({ x: h.x - 20, y: h.y })],
      [propEq("d", Directions.RIGHT), ({ h }) => ({ x: h.x + 20, y: h.y })],
      [propEq("d", Directions.UP), ({ h }) => ({ x: h.x, y: h.y + 20 })],
      [propEq("d", Directions.DOWN), ({ h }) => ({ x: h.x, y: h.y - 20 })],
    ]),
    (h) => [h, ...dropLast(1, tail)]
  )(direction)
);

// Actions
const TickChange = (state) =>
  pipe(
    propOr(INITIAL_TAIL, "tail"),
    computeMove(state.direction),
    objOf("tail"),
    assoc("apple", state.apple),
    when(
      ({ tail, apple }) => tail[0].x === apple.x && tail[0].y === apple.y,
      ({ tail }) => ({
        tail: append(last(state.tail))(tail),
        apple: generateRandomPosition(Math.random),
      })
    ),
    ({ tail, apple }) => ({
      ...state,
      tail,
      apple,
    })
  )(state);

const DirectionChange = (state, direction) =>
  pipe(
    (s) => ({ ...s, direction }),
    TickChange
  )(state);

// Subscriptions
const TickGenerator = (dispatch, getState) => {
  let currentTicks = 0;
  let tail, currentTail = getState().tail;
  let t0 = Date.now();

  const generator = () => {
    currentTail = getState().tail;
    if (currentTail !== tail) {
      currentTicks = 0;
      t0 = Date.now();
    }

    const tailLength = getState().tail.length;
    const time = Date.now();
    const dt = time - t0;
    const newTicks = Math.floor((dt * Math.sqrt(tailLength)) / 300);

    if (newTicks > currentTicks) {
      currentTicks = newTicks;
      dispatch(TickChange, null);
    }

    tail = currentTail;
    requestAnimationFrame(generator);
  };

  generator();
};

const DirectionHandler = (dispatch, getState) => {
  onGlobalKeyDown((e) => {
    const { direction } = getState();
    if (e.key === "ArrowDown" && direction !== Directions.UP) {
      dispatch(DirectionChange, Directions.DOWN);
    } else if (e.key === "ArrowUp" && direction !== Directions.DOWN) {
      dispatch(DirectionChange, Directions.UP);
    } else if (e.key === "ArrowLeft" && direction !== Directions.RIGHT) {
      dispatch(DirectionChange, Directions.LEFT);
    } else if (e.key === "ArrowRight" && direction !== Directions.LEFT) {
      dispatch(DirectionChange, Directions.RIGHT);
    }
  });
};

const store = makeStore(INITIAL_STATE, [TickGenerator, DirectionHandler]);

// Views
const Snake = ({ tail }) =>
  map(({ x, y }) => <TailPiece position={{ x, y }} />)(tail);

const TailPiece = ({ position }) => (
  <Rect x={position.x} y={position.y} z={0} width={19} height={19} />
);

const Apple = ({ apple }) => (
  <Rect x={apple.x} y={apple.y} z={0} width={10} height={10} />
);

const mapStateToProps = (state) => ({
  tail: state.tail,
  wishedDirection: state.wishedDirection,
  direction: state.direction,
});

const EnhancedSnake = withStore(store)(mapStateToProps)(Snake);
const EnhancedApple = withStore(store)((state) => ({ apple: state.apple }))(
  Apple
);
const Scene = () => [<EnhancedApple />, <EnhancedSnake />];

run(<Scene />);
