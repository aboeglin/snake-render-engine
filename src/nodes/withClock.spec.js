import withClock from "./withClock";
import { reconcile } from "../core";
import { createElement } from "../create-element";
import constants from "../constants";

/** @jsx createElement */

const configuredReconcile = reconcile({});

let t = 0;
const getTime = () => {
  t = t + 1;
  return t;
};

const configuredWithClock = withClock(getTime)("time");

describe("withClock", () => {
  test("It should export a withClock function", () => {
    expect(typeof withClock).toBe("function");
  });

  test("withClock should provide getTime as a prop to the Node it enhances", () => {
    jest.useFakeTimers();

    const Node = ({ time }) => {
      return time;
    };

    const NodeWithTime = configuredWithClock(Node);

    const vtree = configuredReconcile(<NodeWithTime />);

    expect(typeof vtree.children[0].children).toBe("number");
    jest.resetAllMocks();
  });

  test("withClock should wrap the given Node with a dynamic Node so that it can rerender as often as possible with time updates", () => {
    jest.useFakeTimers();

    const Node = ({ time }) => {
      return time;
    };

    const NodeWithTime = configuredWithClock(Node);

    const vtree = configuredReconcile(<NodeWithTime />);
    const t0 = vtree.children[0].children;

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    const t1 = vtree.children[0].children;

    expect(t1 - t0).toBeGreaterThan(1);

    jest.resetAllMocks();
  });

  test("withClock should render children", () => {
    jest.useFakeTimers();

    const Snake = ({ time }) => {
      return {
        type: "ANY",
        x: 2,
        y: 3,
        z: time,
      };
    };

    const SnakeWithTime = configuredWithClock(Snake);

    const Scene = () => <SnakeWithTime />;

    const vtree = configuredReconcile(<Scene />);

    const expected = {
      type: Scene,
      props: {},
      children: [
        {
          type: expect.any(Function), // Clock
          props: {},
          children: [
            {
              type: Snake,
              props: { time: 6 },
              children: [{ type: "ANY", x: 2, y: 3, z: 6, children: [] }],
              key: undefined,
            },
          ],
          key: undefined,
        },
      ],
      key: undefined,
    };

    expect(vtree).toEqual(expected);

    jest.resetAllMocks();
  });
});
