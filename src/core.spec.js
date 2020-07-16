import { replaceRaf } from "raf-stub";

import { reconcile, initWithRenderer } from "./core";
import { createClock } from "./clock";
import { createElement } from "./create-element";

replaceRaf([global]);
const getTime = () => 499;
const clock = createClock(getTime);
const lifecycles = {
  mounted: () => {},
  unmounted: () => {},
  __getResolvers: () => ({
    mountedResolvers: [],
    unmountedResolvers: [],
  }),
  __reset: () => {},
};
const config = { clock, lifecycles };

const configuredTraverse = reconcile(config);

describe("core", () => {
  test("It should export a traverse function", () => {
    expect(typeof reconcile).toBe("function");
  });

  test("traverse should be able to handle Nodes that return an array of NodeElements", () => {
    const Scene = () => [
      createElement(Rect, { x: 2, y: 3 }),
      createElement(Rect, { x: 5, y: 7 }),
    ];
    const Rect = (props) => ({
      type: "RECT",
      x: props.x,
      y: props.y,
    });

    const expected = {
      type: Scene,
      props: {},
      children: [
        {
          type: Rect,
          props: {
            x: 2,
            y: 3,
          },
          children: [
            {
              type: "RECT",
              children: [],
              x: 2,
              y: 3,
            },
          ],
        },
        {
          type: Rect,
          props: {
            x: 5,
            y: 7,
          },
          children: [
            {
              type: "RECT",
              children: [],
              x: 5,
              y: 7,
            },
          ],
        },
      ],
    };

    const scene = createElement(Scene);
    const tree = configuredTraverse(scene, {});
    expect(tree).toEqual(expected);
  });

  test("It should export an initWithRenderer function", () => {
    expect(typeof initWithRenderer).toBe("function");
  });

  test("initWithRenderer should register event handlers", () => {
    const container = {
      addEventListener: jest.fn(),
    };

    const render = () => {};

    initWithRenderer(container, render);

    expect(container.addEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function)
    );
  });

  test("initWithRenderer should wire event handlers after start", () => {
    let click = null;
    const expected = jest.fn();

    const ANode = (props) => ({
      type: "Node",
      onClick: expected,
      x: 5,
      y: 5,
      width: 10,
      height: 10,
    });

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {
        click = handler;
      },
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(createElement(ANode));

    click({ offsetX: 10, offsetY: 90, type: "click" });

    expect(expected).toHaveBeenCalled();
  });

  test("nodes should be given a mounted function that takes a function that is executed when the node is first rendered", () => {
    // Check this test again, not sure it does what it should.
    // TODO: Should use setState instead of calling start many times.
    // REWRITE
    const mountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const ANode = (props, { mounted }) => {
      mounted(mountedFn);
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    const aNode = createElement(ANode);
    start(aNode);
    start(aNode); // We trigger a second iteration to be sure it's only called once

    expect(mountedFn).toHaveBeenCalledTimes(1);
  });

  test("nodes should be given a mounted function that is called once for each constructed element", () => {
    // Check this test again, not sure it does what it should.

    const mountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const ANode = (props, { mounted }) => {
      mounted(mountedFn);
    };

    const Scene = () => [createElement(ANode), createElement(ANode)];

    const render = () => {};

    const start = initWithRenderer(container, render);

    const scene = createElement(Scene);
    // We construct a second element that should also call the mountedFn.

    start(scene);

    expect(mountedFn).toHaveBeenCalledTimes(2);
  });

  test("mounted should be called independently for each element when it is first rendered", () => {
    let mountedFns = [];

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const ANode = (props, { mounted }) => {
      const mountedFn = jest.fn();
      mountedFns.push(mountedFn);
      mounted(mountedFn);
    };

    const TwoNodes = () => [createElement(ANode), createElement(ANode)];

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(createElement(TwoNodes));

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  // TODO: Add cases for lifecycles such as children swapping etc ( that might force key to be added or not ).
  test("mounted should be called when a new child is rendered", () => {
    jest.useFakeTimers();
    const mountedFns = [];

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Parent = (_, { mounted, setState, state = false }) => {
      mounted(() => {
        setState(true);
      });

      if (!state) {
        return createElement(Child1);
      } else {
        return createElement(Child2);
      }
    };

    const Child1 = (_, { mounted }) => {
      const cb = jest.fn();
      mountedFns.push(cb);

      mounted(cb);
    };

    const Child2 = (_, { mounted }) => {
      const cb = jest.fn();
      mountedFns.push(cb);

      mounted(cb);
    };

    const render = () => {};

    const start = initWithRenderer(container, render);

    const parent = createElement(Parent);
    start(parent);

    jest.advanceTimersByTime(200);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
    jest.resetAllMocks();
  });

  test("mounted should only be called once for nodes that are re-rendered due to state change", () => {
    jest.useFakeTimers();
    const mountedFn = jest.fn();

    const Wrapper = () => createElement(Child, { value: 18 });

    const Child = ({ value }, { setState, mounted }) => {
      mounted(() => {
        setState(value);
      });

      return createElement(GrandChild, { value });
    };

    const GrandChild = (_, { mounted, state }) => {
      mounted(mountedFn);

      return state;
    };

    const wrapper = createElement(Wrapper);
    configuredTraverse(wrapper);

    jest.advanceTimersByTime(200);
    expect(mountedFn).toHaveBeenCalledTimes(1);
    jest.resetAllMocks();
  });

  test("nodes should be given an unmounted function that takes a function that is executed when the node is not rendered anymore", () => {
    jest.useFakeTimers();
    const unmountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const ANode = (_, { mounted, setState, state = { child: true } }) => {
      mounted(() => {
        setState({ child: false });
      });

      return state.child ? createElement(WillUnmount) : null;
    };

    const Wrapper = () => createElement(ANode);

    const WillUnmount = (_, { unmounted }) => {
      unmounted(unmountedFn);
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    const wrapper = createElement(Wrapper);
    start(wrapper);
    jest.advanceTimersByTime(200);
    expect(unmountedFn).toHaveBeenCalledTimes(1);
    jest.resetAllMocks();
  });

  test("unmounted should not be called if the node is still being rendered", () => {
    // TODO: Should use setState instead of calling start many times.
    // REWRITE
    const unmountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = (props) => createElement(ANode);

    const ANode = (props, { unmounted }) => {
      unmounted(unmountedFn);
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    const wrapper = createElement(Wrapper, { show: true });

    start(wrapper);
    start(wrapper);

    expect(unmountedFn).not.toHaveBeenCalled();
  });

  test("reconcile should resolve the children correctly", () => {
    const Parent = ({ stuff }) =>
      createElement(
        Child,
        {},
        stuff.map((x) => createElement(GrandChild, {}, x))
      );
    const Child = ({ children }) => children;
    const GrandChild = ({ children }) => children;
    const Scene = () => createElement(Parent, { stuff: ["a", "b"] });

    const expected = {
      type: Scene,
      props: {},
      children: [
        {
          type: Parent,
          props: { stuff: ["a", "b"] },
          children: [
            {
              type: Child,
              props: {},
              children: [
                {
                  type: GrandChild,
                  props: {},
                  children: "a",
                },
                {
                  type: GrandChild,
                  props: {},
                  children: "b",
                },
              ],
            },
          ],
        },
      ],
    };

    const actual = configuredTraverse(createElement(Scene));
    expect(actual).toEqual(expected);
  });

  test("state should not be shared for different elements", () => {
    jest.useFakeTimers();

    const Wrapper = () => [
      createElement(StateOwner, { value: 3 }, []),
      createElement(StateOwner, { value: 28 }, []),
    ];

    const StateOwner = ({ value }, { setState, state, mounted }) => {
      mounted(() => {
        setState(value);
      });
      return state;
    };

    const actual = configuredTraverse(createElement(Wrapper, {}, []));
    jest.advanceTimersByTime(200);

    expect(actual.children[0].children).toBe(3);
    expect(actual.children[1].children).toBe(28);
    jest.resetAllMocks();
  });

  test("props should update", () => {
    // TODO: Should use setState instead of calling start many times.
    // REWRITE
    let renders = 0;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = () => {
      renders = renders + 1;
      if (renders < 2) {
        return createElement(StateOwner, { value: 2 });
      } else {
        return createElement(StateOwner, { value: 15 });
      }
    };

    const StateOwner = ({ value }) => {
      if (renders < 2) {
        expect(value).toEqual(2);
      } else {
        expect(value).toEqual(15);
      }
    };

    const render = () => {};

    const start = initWithRenderer(container, render);

    const wrapper = createElement(Wrapper);
    start(wrapper);
    // state set in render one will only be available on next cycles.
    start(wrapper);
    start(wrapper);
    start(wrapper);
  });

  test("setState should trigger a tree update", () => {
    jest.useFakeTimers();
    let actual = null;

    const Wrapper = () => createElement(StateDude);

    const StateDude = (
      _,
      { setState, mounted, state = { mounted: false } }
    ) => {
      mounted(() => setState({ mounted: true }));
      return createElement(Child, { mounted: state.mounted });
    };

    const Child = () => {};

    const expected = {
      type: Wrapper,
      props: {},
      children: [
        {
          type: StateDude,
          props: {},
          children: [
            {
              type: Child,
              props: { mounted: true },
              children: [],
              key: undefined,
            },
          ],
          key: undefined,
        },
      ],
      key: undefined,
    };

    const wrapper = createElement(Wrapper);
    actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(201);
    expect(actual).toEqual(expected);
    jest.resetAllMocks();
  });

  test("updates should be batched", () => {
    jest.useFakeTimers();
    let actual = null;

    const Wrapper = () => [
      createElement(Child, { value: 18, delay: 199 }),
      createElement(Child, { value: 27, delay: 0 }),
    ];

    const Child = ({ value, delay }, { state, setState, mounted }) => {
      mounted(() => {
        setTimeout(() => {
          setState(value);
        }, delay);
      });

      return state;
    };

    const wrapper = createElement(Wrapper);
    actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(201);

    const expected = {
      type: Wrapper,
      props: {},
      children: [
        {
          type: Child,
          props: { value: 18, delay: 199 },
          children: 18,
          key: undefined,
        },
        {
          type: Child,
          props: { value: 27, delay: 0 },
          children: 27,
          key: undefined,
        },
      ],
      key: undefined,
    };

    expect(actual).toEqual(expected);
    jest.resetAllMocks();
  });

  test("updates should not recompute sparks that have already been updated the same batch should update the same spark twice", () => {
    jest.useFakeTimers();
    const Wrapper = () => [
      createElement(Child, { value: 18 }),
      createElement(Child, { value: 27 }),
    ];

    const Child = ({ value }, { setState, mounted }) => {
      mounted(() => {
        setState(value);
      });

      return createElement(GrandChild, { value });
    };

    const GrandChild = jest.fn(({ value }, { mounted, setState, state }) => {
      mounted(() => {
        setState(value);
      });

      return state;
    });

    const wrapper = createElement(Wrapper);
    const actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(200);
    expect(GrandChild).toHaveBeenCalledTimes(4);
    expect(actual.children[0].children[0].children).toBe(18);
    expect(actual.children[1].children[0].children).toBe(27);
    jest.resetAllMocks();
  });

  test("update propagation should stop if state did not change", () => {
    jest.useFakeTimers();
    const Wrapper = (_, { mounted, setState, state = 28 }) => {
      mounted(() => {
        setState(28);
      });
      return createElement(Child, { value: state });
    };

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const wrapper = createElement(Wrapper);
    const actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(200);
    expect(Child).toHaveBeenCalledTimes(1);
    expect(actual.children[0].children).toBe(28);
    jest.resetAllMocks();
  });

  test("update propagation should stop if props did not change", () => {
    jest.useFakeTimers();

    const Wrapper = (_, { mounted, setState }) => {
      mounted(() => {
        setState(29);
      });
      return createElement(Child, { value: 28 });
    };

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const wrapper = createElement(Wrapper);
    const actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(200);
    expect(Child).toHaveBeenCalledTimes(1);
    expect(actual.children[0].children).toBe(28);
    jest.resetAllMocks();
  });

  test("update propagation should not stop if props did change", () => {
    jest.useFakeTimers();

    const Wrapper = (_, { mounted, setState, state = 28 }) => {
      mounted(() => {
        setState(29);
      });
      return createElement(Child, { value: state });
    };

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const wrapper = createElement(Wrapper);
    const actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(200);
    expect(Child).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children).toBe(29);
    jest.resetAllMocks();
  });

  test("update propagation should not stop if prop count did change", () => {
    jest.useFakeTimers();

    const Wrapper = (_, { mounted, setState, state = 28 }) => {
      mounted(() => {
        setState(29);
      });

      return state === 28
        ? createElement(Child, { value: 28 })
        : createElement(Child, { value: 28, valueFromState: state });
    };

    const Child = jest.fn(({ value, valueFromState }) => ({
      value,
      valueFromState,
    }));

    const wrapper = createElement(Wrapper);
    const actual = configuredTraverse(wrapper);

    jest.advanceTimersByTime(200);
    expect(Child).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children).toEqual([{ value: 28, valueFromState: 29, children: [] }]);
    jest.resetAllMocks();
  });

  test.todo("reconcile should mount children added to a node after a setState update");
  test.todo("reconcile should unmount children removed from a node after a setState update");

  // eg: [ NodeA, NodeA, NodeA ] -> [ NodeA, NodeB, Node A ]
  // The second child should be : unmounted ( NodeA ), remounted ( NodeB )
  test.todo("reconcile should unmount children that have changed type after a setState update");
  test.todo("reconcile should resolve children with a key in order to figure out re-ordering without unmounting or mounting nodes");
});
