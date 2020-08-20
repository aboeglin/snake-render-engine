import SRE, {
  initRenderer,
  initWithRenderer,
  Rect,
  withClock,
  enhance,
} from "sre";
import { curry, dropLast, map, once, pipe, reverse } from "ramda";

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

const getT0 = once((t) => t);

const INITIAL_TAIL = [{ x: 310, y: 10 }, { x: 310, y: -10 }];

// const TickChange = (state = , )

const handleKeyDown = curry(({ state, setState }, e) => {
  const wd = state.wishedDirection;
  if (state.direction === wd) {
    if (e.key === "ArrowDown" && wd !== Directions.UP) {
      setState({ ...state, wishedDirection: Directions.DOWN });
    } else if (e.key === "ArrowUp" && wd !== Directions.DOWN) {
      setState({ ...state, wishedDirection: Directions.UP });
    } else if (e.key === "ArrowLeft" && wd !== Directions.RIGHT) {
      setState({ ...state, wishedDirection: Directions.LEFT });
    } else if (e.key === "ArrowRight" && wd !== Directions.LEFT) {
      setState({ ...state, wishedDirection: Directions.RIGHT });
    }
  }
});

const deriveCurrentTicks = curry((tailLength, time) =>
  pipe(
    (t) => t - getT0(t),
    (dt) => Math.floor((dt * Math.sqrt(tailLength)) / 300)
  )(time)
);

const computeMove = curry((shouldAugment, direction, tail) =>
  pipe(
    objOf("d"),
    assoc("h", tail[0]),
    when(propEq("d", Directions.LEFT), ({ h }) => ({ x: h.x - 20, y: h.y })),
    when(propEq("d", Directions.RIGHT), ({ h }) => ({ x: h.x + 20, y: h.y })),
    when(propEq("d", Directions.UP), ({ h }) => ({ x: h.x, y: h.y + 20 })),
    when(propEq("d", Directions.DOWN), ({ h }) => ({ x: h.x, y: h.y - 20 })),
    (h) => [h, ...dropLast(shouldAugment ? 0 : 1, tail)]
  )(direction)
);

// Enhancers
const INITIAL_STATE = {
  tail: INITIAL_TAIL,
  ticks: 0,
  direction: Directions.UP,
  wishedDirection: Directions.UP,
  shouldAugment: false,
};

const deriveTail = enhance(
  ({ onGlobalKeyDown, setState, state = INITIAL_STATE }, props) => {
    onGlobalKeyDown(handleKeyDown({ state, setState }));

    return pipe(
      deriveCurrentTicks(state.tail.length),
      (ticks) => ({
        ticks,
        tail: computeMove(
          state.shouldAugment,
          state.wishedDirection,
          state.tail
        ),
        direction: state.wishedDirection,
      }),
      (d) => {
        if (
          d.tail[0].x === props.apples.apple.x &&
          d.tail[0].y === props.apples.apple.y
        ) {
          props.apples.appleEaten();
          setState({ ...state, shouldAugment: true });
        }
        return d;
      },
      when(
        ({ ticks }) => ticks > state.ticks,
        ({ ticks, tail, direction }) =>
          setState({ ...state, tail, ticks, direction, shouldAugment: false })
      ),
      always(state.tail)
    )(props.time);
  }
);

const pipeEnhancers = (...args) => pipe(...reverse(args));

const withTail = pipeEnhancers(withClock(Date.now)("time"), deriveTail("tail"));

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

const makeAppleGenerator = () => {
  let currentApple = generateRandomPosition(Math.random);
  let cbs = [];

  const generateApple = () => {
    currentApple = generateRandomPosition(Math.random);
    cbs.forEach((f) => f(currentApple));
  };

  const getCurrentApple = () => currentApple;

  const listen = (fn) => {
    cbs.push(fn);
  };

  return {
    getCurrentApple,
    listen,
    generateApple,
  };
};

const appleGenerator = makeAppleGenerator();

const withApples = enhance(
  ({ setState, state = appleGenerator.getCurrentApple(), mounted }) => {
    mounted(() => {
      appleGenerator.listen((newApple) => {
        setState(newApple);
      });
    });

    const appleEaten = () => appleGenerator.generateApple();

    return {
      apple: state,
      appleEaten,
    };
  }
);

// Components
const Snake = ({ tail }) =>
  map(({ x, y }) => <TailPiece position={{ x, y }} />)(tail);

const TailPiece = ({ position }) => (
  <Rect x={position.x} y={position.y} z={0} width={19} height={19} />
);

const Apple = ({ apples }) =>
  console.log("render", apples.apple) || (
    <Rect x={apples.apple.x} y={apples.apple.y} z={0} width={10} height={10} />
  );

const EnhancedSnake = withApples("apples")(withTail(Snake));
const EnhancedApple = withApples("apples")(Apple);
const Scene = () => [<EnhancedApple />, <EnhancedSnake />];

run(<Scene />);
