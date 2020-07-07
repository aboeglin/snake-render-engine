import { replaceRaf } from "raf-stub";

import { traverse, initWithRenderer } from "./core";
import { Node } from "./node";
import { createClock } from "./clock";

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

const configuredTraverse = traverse(config);

describe("core", () => {
  const Scene = Node(() =>
    SomeOtherNode({
      children: [Rect({ x: 2, y: 3 }), Rect({ x: 5, y: 7 })],
    })
  );
  const Rect = Node((props) => ({
    x: props.x,
    y: props.y,
  }));
  const SomeOtherNode = Node((props) => ({
    children: props.children,
  }));

  test("It should export a traverse function", () => {
    expect(typeof traverse).toBe("function");
  });

  test("traverse should resolve the node given", () => {
    const SomeNode = Node(() => {});
    const node = jest.fn(SomeNode({}));
    configuredTraverse(null, node);
    expect(node.mock.calls.length).toBe(1);
  });

  test("traverse should return a tree of resolved nodes", () => {
    const expected = {
      __internal: expect.anything(),
      children: [
        {
          __internal: expect.anything(),
          children: [
            {
              __internal: expect.anything(),
              x: 2,
              y: 3,
              children: [],
            },
            {
              __internal: expect.anything(),
              x: 5,
              y: 7,
              children: [],
            },
          ],
        },
      ],
    };

    const scene = Scene();
    const tree = configuredTraverse(null, scene);
    expect(tree).toEqual(expected);
  });

  test("traverse should be able to handle Nodes that return an array of NodeElements", () => {
    const Scene = Node(() => [Rect({ x: 2, y: 3 }), Rect({ x: 5, y: 7 })]);
    const Rect = Node((props) => ({
      x: props.x,
      y: props.y,
    }));

    const expected = {
      __internal: expect.anything(),
      children: [
        {
          __internal: expect.anything(),
          x: 2,
          y: 3,
          children: [],
        },
        {
          __internal: expect.anything(),
          x: 5,
          y: 7,
          children: [],
        },
      ],
    };

    const scene = Scene();
    const tree = configuredTraverse(null, scene);
    expect(tree).toEqual(expected);
  });

  test("It should export an initWithRenderer function", () => {
    expect(typeof initWithRenderer).toBe("function");
  });

  test("initWithRenderer should accept a renderer function called with the renderer node tree", (done) => {
    const expected = {
      __internal: expect.anything(),
      children: [
        {
          __internal: expect.anything(),
          children: [
            {
              __internal: expect.anything(),
              x: 2,
              y: 3,
              children: [],
            },
            {
              __internal: expect.anything(),
              x: 5,
              y: 7,
              children: [],
            },
          ],
        },
      ],
    };
    const renderer = (tree) => {
      expect(tree).toEqual(expected);
      done();
    };

    const container = {
      addEventListener: jest.fn(),
    };

    const start = initWithRenderer(container, renderer, config);
    start(Scene());
  });

  test("initWithRenderer should accept a renderer function called with the renderer node tree on every requestAnimationFrame", () => {
    const expected = {
      __internal: expect.anything(),
      children: [
        {
          __internal: expect.anything(),
          children: [
            {
              __internal: expect.anything(),
              x: 2,
              y: 3,
              children: [],
            },
            {
              __internal: expect.anything(),
              x: 5,
              y: 7,
              children: [],
            },
          ],
        },
      ],
    };
    const renderer = jest.fn();

    const container = {
      addEventListener: jest.fn(),
    };

    const start = initWithRenderer(container, renderer, config);
    start(Scene());

    requestAnimationFrame.step();

    expect(renderer).toHaveBeenNthCalledWith(2, expected);
  });

  test("initWithRenderer should initialize a clock and give time to render functions", () => {
    const expected = {
      __internal: expect.anything(),
      time: 500,
      children: [],
    };

    const ANode = Node((props, { time }) => ({
      time,
    }));

    const render = jest.fn();

    const container = {
      addEventListener: jest.fn(),
    };

    const start = initWithRenderer(container, render, config);
    start(ANode());

    expect(render).toHaveBeenCalledWith(expected);
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

    const ANode = Node((props, { time }) => ({
      onClick: expected,
      x: 5,
      y: 5,
      width: 10,
      height: 10,
    }));

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {
        click = handler;
      },
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(ANode());

    click({ offsetX: 10, offsetY: 90, type: "click" });

    expect(expected).toHaveBeenCalled();
  });

  test("nodes should be given a mounted function that takes a function that is executed when the node is first rendered", () => {
    // Check this test again, not sure it does what it should.

    const mountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const ANode = Node((props, { mounted }) => {
      mounted(mountedFn);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    const aNode = ANode();
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

    const ANode = Node((props, { mounted }) => {
      mounted(mountedFn);
    });

    const Scene = Node(() => [ANode(), ANode()]);

    const render = () => {};

    const start = initWithRenderer(container, render);

    const scene = Scene();
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

    const ANode = Node((props, { mounted }) => {
      const mountedFn = jest.fn();
      mountedFns.push(mountedFn);
      mounted(mountedFn);
    });

    const TwoNodes = Node(() => [ANode(), ANode()]);

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(TwoNodes());

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  // test.only("playground", () => {
  //   const Node1 = Node((_, { state, setState }) => {
  //     setState(Math.random());
  //     console.log(state);
  //   });

  //   Node1()({});
  //   Node1()({});

  //   const node1 = Node1();
  //   const node2 = Node1();
  //   node1({});
  //   node2({});

  //   node1({});
  //   node2({});
  // });

  // TODO: Add cases for lifecycles such as children swapping etc ( that might force key to be added or not ).
  test("mounted should be called when a new child is rendered", () => {
    let renders = 0;
    const mountedFns = [];

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Parent = Node(() => {
      renders = renders + 1;

      if (renders === 1) {
        return Child1();
      } else {
        return Child2();
      }
    });

    const Child1 = Node((_, { mounted }) => {
      const cb = jest.fn();
      mountedFns.push(cb);

      mounted(cb);
    });

    const Child2 = Node((_, { mounted }) => {
      const cb = jest.fn();
      mountedFns.push(cb);

      mounted(cb);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);

    const parent = Parent();
    start(parent);
    start(parent);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  test("nodes should be given an unmounted function that takes a function that is executed when the node is not rendered anymore", () => {
    // Doesn't work, we need to do tree diff in order to resolve instances of nodes.
    const unmountedFn = jest.fn();
    let renders = 0;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const ANode = Node((props) => {
      renders = renders + 1;

      return renders > 1 && renders < 3 ? null : WillUnmount();
    });

    const Wrapper = Node((props) => ANode());

    const WillUnmount = Node((props, { unmounted }) => {
      unmounted(unmountedFn);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    const wrapper = Wrapper();
    start(wrapper);
    expect(unmountedFn).toHaveBeenCalledTimes(0);
    start(wrapper); // We trigger a second iteration to be sure it's only called once
    start(wrapper); // We trigger a second iteration to be sure it's only called once
    start(wrapper); // We trigger a second iteration to be sure it's only called once

    expect(unmountedFn).toHaveBeenCalledTimes(1);
  });

  test("unmounted should not be called if the node is still being rendered", () => {
    const unmountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((props) => ANode());

    const ANode = Node((props, { unmounted }) => {
      unmounted(unmountedFn);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    const wrapper = Wrapper({ show: true });

    start(wrapper);
    start(wrapper);

    expect(unmountedFn).not.toHaveBeenCalled();
  });

  test("traverse should provide a setContext function to set data in context", () => {
    const expected = 1;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((_, { setContext }) => {
      setContext("stuff", expected);

      return ANode();
    });

    const ANode = Node((_, { getContext }) => {
      expect(getContext("stuff")).toBe(expected);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(Wrapper());
  });

  test("context should also be available for array children", () => {
    const expected = 1;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((_, { setContext }) => {
      setContext("stuff", expected);

      return { children: [ANode()] };
    });

    const ANode = Node((_, { getContext }) => {
      expect(getContext("stuff")).toBe(expected);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(Wrapper());
  });

  test("context should also be available for array nodes", () => {
    const expected = 1;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((_, { setContext }) => {
      setContext("stuff", expected);

      return [ANode()];
    });

    const ANode = Node((_, { getContext }) => {
      expect(getContext("stuff")).toBe(expected);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(Wrapper());
  });

  test("context should remain accross re-renders", () => {
    const expected = 1;
    let actual = null;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((_, { setContext, mounted }) => {
      mounted(() => setContext("stuff", expected));
      return [ANode()];
    });

    const ANode = Node((_, { getContext }) => {
      actual = getContext("stuff");
    });

    const render = () => {};

    const start = initWithRenderer(container, render);

    const wrapper = Wrapper();
    start(wrapper);
    start(wrapper);
    start(wrapper);

    expect(actual).toBe(expected);
  });

  test("nodes should be given a state object and a setState function to interface with state", (done) => {
    const expected = 1;
    let renders = 0;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node(() => StateOwner());

    const StateOwner = Node((_, { setState, state, mounted }) => {
      renders = renders + 1;

      mounted(() => {
        setState(expected);
      });

      if (renders === 3) {
        expect(state).toEqual(expected);
        done();
      }
    });

    const render = () => {};

    const start = initWithRenderer(container, render);

    const wrapper = Wrapper();
    start(wrapper);
    // state set in render one will only be available on next cycles.
    start(wrapper);
    start(wrapper);
  });

  test.only("state should not be shared for different elements", () => {
    let renders = 0;

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node(() => [
      StateOwner({ value: 3 }),
      StateOwner({ value: 28 }),
    ]);

    const StateOwner = Node(({ value }, { setState, state, mounted }) => {
      renders = renders + 1;

      if (renders === 1) {
        setState(value);
      }

      if (renders === 3) {
        expect(state).toEqual(value);
      }
    });

    const render = () => {};

    const start = initWithRenderer(container, render);

    const wrapper = Wrapper();
    start(wrapper);
    // state set in render one will only be available on next cycles.
    start(wrapper);
    start(wrapper);
  });
});
