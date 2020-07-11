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
    unmountedResolvers: []
  }),
  __reset: () => {}
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
      createElement(Rect, { x: 5, y: 7 })
    ];
    const Rect = props => ({
      x: props.x,
      y: props.y
    });

    const expected = {
      type: Scene,
      props: {},
      children: [
        {
          type: Rect,
          props: {
            x: 2,
            y: 3
          },
          children: [
            {
              children: [],
              x: 2,
              y: 3
            }
          ]
        },
        {
          type: Rect,
          props: {
            x: 5,
            y: 7
          },
          children: [
            {
              children: [],
              x: 5,
              y: 7
            }
          ]
        }
      ]
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
      addEventListener: jest.fn()
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

    const ANode = props => ({
      onClick: expected,
      x: 5,
      y: 5,
      width: 10,
      height: 10
    });

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {
        click = handler;
      }
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(createElement(ANode));

    click({ offsetX: 10, offsetY: 90, type: "click" });

    expect(expected).toHaveBeenCalled();
  });

  test("nodes should be given a mounted function that takes a function that is executed when the node is first rendered", () => {
    // Check this test again, not sure it does what it should.
    const mountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {}
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
      addEventListener: (type, handler) => {}
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
      addEventListener: (type, handler) => {}
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
    let renders = 0;
    const mountedFns = [];

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {}
    };

    const Parent = () => {
      renders = renders + 1;

      if (renders === 1) {
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
    start(parent);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  test("nodes should be given an unmounted function that takes a function that is executed when the node is not rendered anymore", done => {
    const unmountedFn = jest.fn(() => {
      done();
    });

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {}
    };

    const ANode = (_, { mounted, setState, state = { child: true } }) => {
      if (!state) {
        state = { child: true };
      }
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
    expect(unmountedFn).toHaveBeenCalledTimes(0);
  });

  test("unmounted should not be called if the node is still being rendered", () => {
    const unmountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {}
    };

    const Wrapper = props => createElement(ANode);

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

  test("traverse should resolve the children correctly", () => {
    const Parent = ({ stuff }) =>
      createElement(
        Child,
        {},
        stuff.map(x => createElement(GrandChild, {}, x))
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
                  children: "a"
                },
                {
                  type: GrandChild,
                  props: {},
                  children: "b"
                }
              ]
            }
          ]
        }
      ]
    };

    const actual = configuredTraverse(createElement(Scene));
    expect(actual).toEqual(expected);
  });

  test("state should not be shared for different elements", () => {
    let renders = 0;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {}
    };

    const Wrapper = () => [
      createElement(StateOwner, { value: 3 }, []),
      createElement(StateOwner, { value: 28 }, [])
    ];

    const StateOwner = ({ value }, { setState, state, mounted }) => {
      renders = renders + 1;

      mounted(() => {
        setState(value);
      });

      if (renders === 3) {
        expect(state).toEqual(value);
      }
    };

    const render = () => {};

    const start = initWithRenderer(container, render);

    const wrapper = createElement(Wrapper, {}, []);
    start(wrapper);
  });

  test("props should update", () => {
    let renders = 0;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {}
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

  test("setState should trigger a tree update", done => {
    let actual = null;

    const Wrapper = () => createElement(StateDude);

    const StateDude = (_, { setState, mounted, state }) => {
      mounted(() => setState({ mounted: true }));

      return createElement(Child, { mounted: state ? state.mounted : false });
    };

    const Child = ({ mounted }) => {
      if (mounted) {
        setTimeout(() => {
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
                    children: [{ mounted: true, children: [] }],
                    key: undefined
                  }
                ],
                key: undefined
              }
            ],
            key: undefined
          };
          expect(actual).toEqual(expected);
          done();
        }, 300);
      }
      return { mounted };
    };

    const wrapper = createElement(Wrapper);
    actual = configuredTraverse(wrapper);
  });
});
