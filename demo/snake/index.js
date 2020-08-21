import SRE, {
  initRenderer,
  initWithRenderer,
  Rect,
  enhance,
  onGlobalKeyDown,
} from "sre";

import {
  append,
  assoc,
  curry,
  dropLast,
  map,
  objOf,
  once,
  pipe,
  propEq,
  propOr,
  reject,
  when,
  forEach,
} from "ramda";

// Store
const makeStore = (initialState = {}, subs = []) => {
  let state = initialState;
  let listeners = [];

  const dispatch = curry((action, payload) => {
    state = action(state, payload);
    listeners.forEach((f) => f(state));
  });

  const listen = (cb) => {
    listeners = append(cb, listeners);
    cb(state);

    return () => {
      listeners = reject(cb, listeners);
    };
  };

  const getState = () => state;

  forEach((s) => s(dispatch, getState))(subs);

  return {
    listen,
    dispatch,
    getState,
  };
};

const withStore = (store) => (
  mapStateToProps = () => ({}),
  mapDispatchToProps = () => ({})
) => {
  let unlisten = null;
  return enhance(
    ({
      state = mapStateToProps(store.getState()),
      setState,
      mounted,
      unmounted,
    }) => {
      const handleStateChanged = (newState) => {
        setState(mapStateToProps(newState));
      };

      mounted(() => {
        unlisten = store.listen(handleStateChanged);
      });

      unmounted(() => unlisten && unlisten());

      return { ...state, ...mapDispatchToProps(store.dispatch) };
    }
  )("store");
};

// ---- BEGINNING ---
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
  { x: 310, y: -30 },
  { x: 310, y: -50 },
];
const INITIAL_STATE = {
  tail: INITIAL_TAIL,
  direction: Directions.UP,
  wishedDirection: Directions.UP,
  apple: generateRandomPosition(Math.random),
};

const getT0 = once((t) => t);

const computeMove = curry((direction, tail) =>
  pipe(
    objOf("d"),
    assoc("h", tail[0]),
    when(propEq("d", Directions.LEFT), ({ h }) => ({ x: h.x - 20, y: h.y })),
    when(propEq("d", Directions.RIGHT), ({ h }) => ({ x: h.x + 20, y: h.y })),
    when(propEq("d", Directions.UP), ({ h }) => ({ x: h.x, y: h.y + 20 })),
    when(propEq("d", Directions.DOWN), ({ h }) => ({ x: h.x, y: h.y - 20 })),
    (h) => [h, ...dropLast(1, tail)]
  )(direction)
);

const TickChange = (state) =>
  pipe(
    propOr(INITIAL_TAIL, "tail"),
    computeMove(state.direction),
    (tail) => ({ ...state, tail, direction: state.wishedDirection })
  )(state);

const TickGenerator = (dispatch, getState) => {
  let currentTicks = 0;

  const generator = () => {
    const tailLength = getState().tail.length;
    const time = Date.now();
    const dt = time - getT0(time);
    const newTicks = Math.floor((dt * Math.sqrt(tailLength)) / 300);

    if (newTicks > currentTicks) {
      currentTicks = newTicks;
      dispatch(TickChange, null);
    }

    requestAnimationFrame(() => {
      generator();
    });
  };

  generator();
};

const DirectionChange = (state, direction) => ({
  ...state,
  wishedDirection: direction,
});

const DirectionHandler = (dispatch, getState) => {
  onGlobalKeyDown((e) => {
    const { direction, wishedDirection } = getState();
    const wd = wishedDirection;
    if (direction === wd) {
      if (e.key === "ArrowDown" && wd !== Directions.UP) {
        dispatch(DirectionChange, Directions.DOWN);
      } else if (e.key === "ArrowUp" && wd !== Directions.DOWN) {
        dispatch(DirectionChange, Directions.UP);
      } else if (e.key === "ArrowLeft" && wd !== Directions.RIGHT) {
        dispatch(DirectionChange, Directions.LEFT);
      } else if (e.key === "ArrowRight" && wd !== Directions.LEFT) {
        dispatch(DirectionChange, Directions.RIGHT);
      }
    }
  });
};

const store = makeStore(INITIAL_STATE, [TickGenerator, DirectionHandler]);

// Components
const Snake = ({ store: { tail } }) =>
  map(({ x, y }) => <TailPiece position={{ x, y }} />)(tail);

const TailPiece = ({ position }) => (
  <Rect x={position.x} y={position.y} z={0} width={19} height={19} />
);

const Apple = ({ store: { apple } }) => (
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
