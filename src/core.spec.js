import { reconcile, initWithRenderer, enhance } from "./core";
import { createClock } from "./clock";
import { createElement } from "./create-element";
import constants from "./constants";

/** @jsx createElement */

const configuredReconcile = reconcile({});

describe("core", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("It should export a traverse function", () => {
    expect(typeof reconcile).toBe("function");
  });

  test("traverse should be able to handle Nodes that return an array of NodeElements", () => {
    const Scene = () => [<Rect x={2} y={3} />, <Rect x={5} y={7} />];
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

    const tree = configuredReconcile(<Scene />);
    expect(tree).toEqual(expected);
  });

  test("It should export an initWithRenderer function", () => {
    expect(typeof initWithRenderer).toBe("function");
  });

  test("initWithRenderer should register click event handlers", () => {
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

  test("initWithRenderer should register keypress event handlers", () => {
    const container = {
      addEventListener: jest.fn(),
    };

    document.body.addEventListener = jest.fn();

    const render = () => {};

    initWithRenderer(container, render);

    expect(document.body.addEventListener).toHaveBeenCalledWith(
      "keypress",
      expect.any(Function)
    );
  });

  test("initWithRenderer should register keydown event handlers", () => {
    const container = {
      addEventListener: jest.fn(),
    };

    document.body.addEventListener = jest.fn();

    const render = () => {};

    initWithRenderer(container, render);

    expect(document.body.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  test("initWithRenderer should wire event handlers after start", () => {
    let click = null;
    const expected = jest.fn();

    const ANode = () => ({
      type: "Node",
      props: { onClick: expected, x: 5, y: 5, width: 10, height: 10 },
    });

    const container = {
      clientHeight: 100,
      addEventListener: (type, handler) => {
        click = handler;
      },
    };

    const render = () => {};

    const start = initWithRenderer(container, render);
    start(<ANode />);

    click({ offsetX: 10, offsetY: 90, type: "click" });

    expect(expected).toHaveBeenCalled();
  });

  test("nodes should be given a mounted function that takes a function that is executed when the node is first rendered", () => {
    const mountedFn = jest.fn();

    const ANode = (_, { mounted }) => {
      mounted(mountedFn);
    };

    configuredReconcile(<ANode />);
    expect(mountedFn).toHaveBeenCalledTimes(1);
  });

  test("nodes should be given a mounted function that is called once for each constructed element", () => {
    const mountedFn = jest.fn();

    const ANode = (_, { mounted }) => {
      mounted(mountedFn);
    };

    const Scene = () => [<ANode />, <ANode />];

    configuredReconcile(<Scene />);
    expect(mountedFn).toHaveBeenCalledTimes(2);
  });

  test("mounted should be called independently for each element when it is first rendered", () => {
    let mountedFns = [];

    const ANode = (_, { mounted }) => {
      const mountedFn = jest.fn();
      mountedFns.push(mountedFn);
      mounted(mountedFn);
    };

    const TwoNodes = () => [<ANode />, <ANode />];

    configuredReconcile(<TwoNodes />);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  test("mounted should be called when a new child is rendered", () => {
    const mountedFns = [];

    const Parent = (_, { mounted, setState, state = false }) => {
      mounted(() => {
        setState(true);
      });

      return !state ? <Child1 /> : <Child2 />;
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

    configuredReconcile(<Parent />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  test("mounted should only be called once for nodes that are re-rendered due to state change", () => {
    const mountedFn = jest.fn();

    const Wrapper = () => <Child value={18} />;

    const Child = ({ value }, { setState, mounted }) => {
      mounted(() => {
        setState(value);
      });

      return <GrandChild value={value} />;
    };

    const GrandChild = (_, { mounted, state }) => {
      mounted(mountedFn);

      return state;
    };

    configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(mountedFn).toHaveBeenCalledTimes(1);
  });

  test("nodes should be given an unmounted function that takes a function that is executed when the node is not rendered anymore", () => {
    const unmountedFn = jest.fn();

    const ANode = (_, { mounted, setState, state = { child: true } }) => {
      mounted(() => {
        setState({ child: false });
      });

      return state.child ? <WillUnmount /> : null;
    };

    const Wrapper = () => <ANode />;

    const WillUnmount = (_, { unmounted }) => {
      unmounted(unmountedFn);
    };

    configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(unmountedFn).toHaveBeenCalledTimes(1);
  });

  test("unmounted should not be called if the node is still being rendered", () => {
    const unmountedFn = jest.fn();

    const Wrapper = () => <ANode />;

    const ANode = jest.fn((_, { unmounted, setState, mounted }) => {
      mounted(() => {
        setState("Trigger update");
      });
      unmounted(unmountedFn);
    });

    configuredReconcile(<Wrapper show={true} />);
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL + 1);

    expect(unmountedFn).not.toHaveBeenCalled();
    expect(ANode).toHaveBeenCalledTimes(2);
  });

  test("reconcile should resolve the children correctly", () => {
    const Parent = ({ stuff }) => (
      <Child>
        {stuff.map((x) => (
          <GrandChild>{x}</GrandChild>
        ))}
      </Child>
    );

    const Child = ({ children }) => children;
    const GrandChild = ({ children }) => children;
    const Scene = () => <Parent stuff={["a", "b"]} />;

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

    const actual = configuredReconcile(<Scene />);
    expect(actual).toEqual(expected);
  });

  test("state should not be shared for different elements", () => {
    const Wrapper = () => [<StateOwner value={3} />, <StateOwner value={28} />];

    const StateOwner = ({ value }, { setState, state, mounted }) => {
      mounted(() => {
        setState(value);
      });
      return state;
    };

    const actual = configuredReconcile(<Wrapper />);
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(actual.children[0].children).toBe(3);
    expect(actual.children[1].children).toBe(28);
  });

  test("props should update", () => {
    const Wrapper = (_, { mounted, setState, state = 2 }) => {
      mounted(() => {
        setState(15);
      });
      return <StateOwner value={state} />;
    };

    const StateOwner = ({ value }) => {
      return value;
    };

    const actual = configuredReconcile(<Wrapper />);

    expect(actual.children[0].children).toBe(2);
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(actual.children[0].children).toBe(15);
  });

  test("setState should trigger a tree update", () => {
    let actual = null;

    const Wrapper = () => <StateDude />;

    const StateDude = (
      _,
      { setState, mounted, state = { mounted: false } }
    ) => {
      mounted(() => setState({ mounted: true }));
      return <Child mounted={state.mounted} />;
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

    actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(actual).toEqual(expected);
  });

  test("updates should be batched", () => {
    let actual = null;

    const delay = constants.BATCH_UPDATE_INTERVAL - 1;

    const Wrapper = () => [
      <Child value={18} delay={delay} />,
      <Child value={27} delay={0} />,
    ];

    const Child = ({ value, delay }, { state, setState, mounted }) => {
      mounted(() => {
        setTimeout(() => {
          setState(value);
        }, delay);
      });

      return state;
    };

    actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    const expected = {
      type: Wrapper,
      props: {},
      children: [
        {
          type: Child,
          props: { value: 18, delay },
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
  });

  test("updates should not recompute sparks that have already been updated the same batch should update the same spark twice", () => {
    const Wrapper = () => [<Child value={18} />, <Child value={27} />];

    const Child = ({ value }, { setState, mounted }) => {
      mounted(() => {
        setState(value);
      });

      return <GrandChild value={value} />;
    };

    const GrandChild = jest.fn(({ value }, { mounted, setState, state }) => {
      mounted(() => {
        setState(value);
      });

      return state;
    });

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(GrandChild).toHaveBeenCalledTimes(4);
    expect(actual.children[0].children[0].children).toBe(18);
    expect(actual.children[1].children[0].children).toBe(27);
  });

  test("update propagation should stop if state did not change", () => {
    const Wrapper = (_, { mounted, setState, state = 28 }) => {
      mounted(() => {
        setState(28);
      });
      return <Child value={state} />;
    };

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(1);
    expect(actual.children[0].children).toBe(28);
  });

  test("update propagation should stop if props did not change", () => {
    const Wrapper = (_, { mounted, setState }) => {
      mounted(() => {
        setState(29);
      });
      return <Child value={28} />;
    };

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(1);
    expect(actual.children[0].children).toBe(28);
  });

  test("update propagation should not stop if props did change", () => {
    const Wrapper = (_, { mounted, setState, state = 28 }) => {
      mounted(() => {
        setState(29);
      });
      return <Child value={state} />;
    };

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children).toBe(29);
  });

  test("update propagation should not stop if prop count did change", () => {
    const Wrapper = (_, { mounted, setState, state = 28 }) => {
      mounted(() => {
        setState(29);
      });

      return state === 28 ? (
        <Child value={28} />
      ) : (
        <Child value={28} valueFromState={state} />
      );
    };

    const Child = jest.fn(({ value, valueFromState }) => ({
      value,
      valueFromState,
      type: "UNKNOWN",
    }));

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children).toEqual([
      { type: "UNKNOWN", value: 28, valueFromState: 29, children: [] },
    ]);
  });

  test("reconcile should mount children added to a node after a setState update", () => {
    const mountedFn = jest.fn();

    const Wrapper = (_, { mounted, setState, state = 1 }) => {
      mounted(() => {
        setState(2);
      });

      return state === 1 ? [<Child />] : [<Child />, <Child />];
    };

    const Child = (_, { mounted }) => {
      mounted(mountedFn);
    };

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(mountedFn).toHaveBeenCalledTimes(2);
    expect(actual.children.length).toBe(2);
  });

  test("reconcile should unmount children removed from a node after a setState update", () => {
    const unmountedFn = jest.fn();

    const Wrapper = (_, { mounted, setState, state = 2 }) => {
      mounted(() => {
        setState(1);
      });

      return state === 1 ? [<Child />] : [<Child />, <ChildThatUnmounts />];
    };

    const ChildThatUnmounts = (_, { unmounted }) => {
      unmounted(unmountedFn);
    };

    const Child = () => {};

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(unmountedFn).toHaveBeenCalledTimes(1);
    expect(actual.children.length).toBe(1);
  });

  // eg: [ NodeA, NodeA, NodeA ] -> [ NodeA, NodeB, Node A ]
  // The second child should be : unmounted ( NodeA ), remounted ( NodeB )
  test("reconcile should unmount children that have changed type after a setState update", () => {
    const unmountedFn = jest.fn();

    const Wrapper = (_, { mounted, setState, state = 2 }) => {
      mounted(() => {
        setState(1);
      });

      return state === 1
        ? [<Child />, <Child />, <Child />]
        : [<Child />, <ChildThatUnmounts />, <Child />];
    };

    const ChildThatUnmounts = (_, { unmounted }) => {
      unmounted(unmountedFn);
    };

    const Child = () => {};

    configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(unmountedFn).toHaveBeenCalledTimes(1);
  });

  test("reconcile should resolve children with a key in order to figure out re-ordering without unmounting or mounting nodes", () => {
    const unmountedFn = jest.fn();
    const mountedFn = jest.fn();

    const withCount = enhance(({ mounted, setState, state = 1 }, props) => {
      mounted(() => {
        setState(2);
      });

      return { ...props, count: state };
    });

    const Wrapper = ({ count }) => {
      return count === 1
        ? [
            <ChildThatShouldNotUnmount key={1} />,
            <Child key={2} />,
            <Child key={3} />,
          ]
        : [
            <Child key={2} />,
            <ChildThatShouldNotUnmount key={1} />,
            <Child key={3} />,
          ];
    };

    const WrapperWithCount = withCount(Wrapper);

    const withLifecycles = enhance(({ mounted, unmounted }, props) => {
      mounted(mountedFn);
      unmounted(unmountedFn);

      return props;
    });

    const Child = () => {};
    const ChildThatShouldNotUnmount = withLifecycles(Child);

    const actual = configuredReconcile(<WrapperWithCount />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(unmountedFn).not.toHaveBeenCalled();
    expect(mountedFn).toHaveBeenCalledTimes(1);

    expect(actual.children[0].children[0].type).toBe(Child);
    expect(actual.children[0].children[1].type).toBe(ChildThatShouldNotUnmount);
    expect(actual.children[0].children[2].type).toBe(Child);
  });

  test("children should be ignored when explicit ones are defined", () => {
    const Wrapper = () => <Child>a</Child>;
    const Child = ({ children }) => children;

    const actual = configuredReconcile(<Wrapper>b</Wrapper>);

    expect(actual.children[0].children[0]).toBe("a");
  });

  test("nodes should be able to declare themselves as dynamic, making them being re-rendered as often as possible", () => {
    jest.useFakeTimers();
    const makeDynamic = enhance(({ dynamic }, props) => {
      dynamic(true);
      return props;
    });
    const DynamicNode = jest.fn(makeDynamic(() => {}));

    configuredReconcile(<DynamicNode />); // First render

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL); // Second render
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL); // Third render

    expect(DynamicNode).toHaveBeenCalledTimes(3);
  });

  test("nodes that are nested should not have their state reset when some parent triggers an update", () => {
    let mountedFn = null;

    const GrandFather = (_, { setState, state = null }) => {
      return <Father value={state} onChanged={(v) => setState(v)} />;
    };

    const Father = (props) => {
      return <Child value={props.value} onChanged={props.onChanged} />;
    };

    const Child = jest.fn((props, { mounted, setState, state = 1 }) => {
      if (!mountedFn) {
        mountedFn = jest.fn(() => setState(2));
      }

      mounted(mountedFn);

      if (state === 2) {
        props.onChanged(state);
      }

      return state;
    });

    const vtree = configuredReconcile(<GrandFather />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(Child).toHaveBeenCalledTimes(3);
    expect(mountedFn).toHaveBeenCalledTimes(1);
    expect(vtree.children[0].children[0].children).toBe(2);
  });

  test("enhance should provide node side-effect utilities to deal with lifecycles or state", () => {
    jest.useFakeTimers();

    const withState = enhance(({ mounted, setState, state = null }, props) => {
      mounted(() => {
        setState(1);
      });

      return { ...props, actual: state };
    });

    const Node = (props) => props;

    const EnhancedNode = withState(Node);

    const vtree = configuredReconcile(<EnhancedNode />); // First render

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL); // Second render

    expect(vtree.children[0].props).toEqual({ actual: 1 });

    jest.resetAllMocks();
  });
});
