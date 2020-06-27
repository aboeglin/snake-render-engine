const { replaceRaf } = require("raf-stub");

const { traverse, initWithRenderer } = require("./core");
const { Node } = require("./node");
const { createClock } = require("./clock");

replaceRaf([global]);
const getTime = () => 499;
const clock = createClock(getTime);
const lifecycles = {
  mounted: () => {},
  __getHandlers: () => ({
    mountedHandlers: [],
    unmountedHandlers: [],
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
    configuredTraverse(node);
    expect(node.mock.calls.length).toBe(1);
  });

  test("traverse should return a tree of resolved nodes", () => {
    const expected = {
      children: [
        {
          children: [
            { x: 2, y: 3, children: [] },
            { x: 5, y: 7, children: [] },
          ],
        },
      ],
    };

    const scene = Scene();
    const tree = configuredTraverse(scene);
    expect(tree).toEqual(expected);
  });

  test("traverse should be able to handle Nodes that return an array of NodeElements", () => {
    const Scene = Node(() => [Rect({ x: 2, y: 3 }), Rect({ x: 5, y: 7 })]);
    const Rect = Node((props) => ({
      x: props.x,
      y: props.y,
    }));

    const expected = {
      children: [{ x: 2, y: 3, children: [] }, { x: 5, y: 7, children: [] }],
    };

    const scene = Scene();
    const tree = configuredTraverse(scene);
    expect(tree).toEqual(expected);
  });

  test("It should export an initWithRenderer function", () => {
    expect(typeof initWithRenderer).toBe("function");
  });

  test("initWithRenderer should accept a renderer function called with the renderer node tree", (done) => {
    const expected = {
      children: [
        {
          children: [
            { x: 2, y: 3, children: [] },
            { x: 5, y: 7, children: [] },
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
      children: [
        {
          children: [
            { x: 2, y: 3, children: [] },
            { x: 5, y: 7, children: [] },
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
    const expected = { time: 500, children: [] };

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
    start(ANode());
    start(ANode()); // We trigger a second iteration to be sure it's only called once

    expect(mountedFn).toHaveBeenCalledTimes(1);
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

  test("nodes should be given a unmounted function that takes a function that is executed when the node is not rendered anymore", () => {
    const unmountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((props) => (props.show ? ANode() : null));

    const ANode = Node((props, { unmounted }) => {
      unmounted(unmountedFn);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(Wrapper({ show: true }));
    start(Wrapper({ show: false })); // We trigger a second iteration to be sure it's only called once

    expect(unmountedFn).toHaveBeenCalledTimes(1);
  });

  test("unmounted should not be called if the node is still being rendered", () => {
    const unmountedFn = jest.fn();

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {},
    };

    const Wrapper = Node((props) => (props.show ? ANode() : null));

    const ANode = Node((props, { unmounted }) => {
      unmounted(unmountedFn);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(Wrapper({ show: true }));
    start(Wrapper({ show: true })); // We trigger a second iteration to be sure it's only called once

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

    const ANode = Node((_, { context }) => {
      expect(context.stuff).toBe(expected);
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

    const ANode = Node((_, { context }) => {
      expect(context.stuff).toBe(expected);
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

    const ANode = Node((_, { context }) => {
      expect(context.stuff).toBe(expected);
    });

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(Wrapper());
  });

  // test("nodes should be given a mounted function that takes a function that is executed when the node is first rendered", () => {
  //   const mountedFn = jest.fn();

  //   const container = {
  //     clientHeight: 100,
  //     addEventListener: (type, handler) => {},
  //   };

  //   const ANode = Node((props, { mounted }) => {
  //     mounted(mountedFn);
  //   });

  //   const TwoNodes = Node(() => ([
  //     ANode(),
  //     ANode(),
  //   ]));

  //   const render = () => {};

  //   const start = initWithRenderer(container, render, { clock });
  //   start(TwoNodes());

  //   expect(mountedFn).toHaveBeenCalledTimes(2);
  // });
});
