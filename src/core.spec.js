import { reconcile, initWithRenderer, enhance } from "./core";
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

  test("reconcile should be able to handle Nodes that return an array of NodeElements", () => {
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

  test("enhance should be given a mounted function that takes a function that is executed when the node is first rendered", () => {
    const mountedFn = jest.fn();

    const withMounted = enhance(({ mounted }) => mounted(mountedFn));

    const ANode = withMounted(null, () => {});

    configuredReconcile(<ANode />);
    expect(mountedFn).toHaveBeenCalledTimes(1);
  });

  test("nodes should be given a mounted function that is called once for each constructed element", () => {
    const mountedFn = jest.fn();

    const withMounted = enhance(({ mounted }) => mounted(mountedFn));

    const ANode = withMounted(null, () => {});

    const Scene = () => [<ANode />, <ANode />];

    configuredReconcile(<Scene />);
    expect(mountedFn).toHaveBeenCalledTimes(2);
  });

  test("mounted should be called independently for each element when it is first rendered", () => {
    let mountedFns = [];

    const withMounted = enhance(({ mounted }) => {
      const mountedFn = jest.fn();
      mountedFns.push(mountedFn);
      mounted(mountedFn);
    });

    const ANode = withMounted(null, () => {});

    const TwoNodes = () => [<ANode />, <ANode />];

    configuredReconcile(<TwoNodes />);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  test("mounted should be called when a new child is rendered", () => {
    const mountedFns = [];

    const withMounted = enhance(({ mounted }) => {
      const mountedFn = jest.fn();
      mountedFns.push(mountedFn);
      mounted(mountedFn);
    });

    const withIsMounted = enhance(({ mounted, setState, state = false }) => {
      mounted(() => {
        setState(true);
      });

      return state;
    });

    const Parent = ({ isMounted }) => (!isMounted ? <Child1 /> : <Child2 />);
    const ParentWithIsMounted = withIsMounted("isMounted", Parent);

    const Child1 = withMounted(null, () => {});
    const Child2 = withMounted(null, () => {});

    configuredReconcile(<ParentWithIsMounted />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(mountedFns[0]).toHaveBeenCalledTimes(1);
    expect(mountedFns[1]).toHaveBeenCalledTimes(1);
  });

  test("mounted should only be called once for nodes that are re-rendered due to state change", () => {
    const mountedFn = jest.fn();

    const Wrapper = () => <ChildWithValue value={18} />;

    const withValue = enhance(({ setState, mounted, state = 1 }, { value }) => {
      mounted(() => setState(value));
      return state;
    });

    const Child = ({ value }) => <GrandChild value={value} />;
    const ChildWithValue = jest.fn(withValue("value", Child));

    const withMountedChecker = enhance(({ mounted }) => mounted(mountedFn));
    const GrandChild = jest.fn(withMountedChecker(null, () => {}));

    configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(mountedFn).toHaveBeenCalledTimes(1);
    expect(ChildWithValue).toHaveBeenCalledTimes(2);
    expect(GrandChild).toHaveBeenCalledTimes(2);
  });

  test("nodes should be given an unmounted function that takes a function that is executed when the node is not rendered anymore", () => {
    const unmountedFn = jest.fn();

    const ANode = ({ hasChild }) => (hasChild ? <WillUnmount /> : null);
    const withHasChild = enhance(({ mounted, setState, state = true }) => {
      mounted(() => {
        setState(false);
      });

      return state;
    });

    const ANodeWithHasChild = withHasChild("hasChild", ANode);

    const Wrapper = () => <ANodeWithHasChild />;

    const WillUnmount = enhance(
      ({ unmounted }) => {
        unmounted(unmountedFn);
      },
      null,
      () => {}
    );

    configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(unmountedFn).toHaveBeenCalledTimes(1);
  });

  test("unmounted should not be called if the node is still being rendered", () => {
    const unmountedFn = jest.fn();

    const Wrapper = () => <ANode />;

    const withUnmountedChecker = enhance(({ unmounted, setState, mounted }) => {
      mounted(() => {
        setState("Trigger update");
      });
      unmounted(unmountedFn);
    });

    const ANode = jest.fn(withUnmountedChecker(null, () => {}));

    configuredReconcile(<Wrapper show={true} />);
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

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

    const withState = enhance(({ setState, state, mounted }, { value }) => {
      mounted(() => setState(value));
      return state;
    });

    const StateOwner = withState("value", ({ value }) => value);

    const actual = configuredReconcile(<Wrapper />);
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(actual.children[0].children[0].children).toBe(3);
    expect(actual.children[1].children[0].children).toBe(28);
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

    const withState = enhance(({ setState, mounted, state = false }) => {
      mounted(() => setState(true));
      return state;
    });

    const Dude = ({ mounted }) => <Child mounted={mounted} />;
    const StateDude = withState("mounted", Dude);

    const Child = () => {};

    const expected = {
      type: Wrapper,
      props: {},
      children: [
        {
          type: expect.anything(), // enhancer
          props: {},
          key: undefined,
          children: [
            {
              type: Dude,
              props: { mounted: true },
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
      <ChildWithFakeAsync value={18} delay={delay} />,
      <ChildWithFakeAsync value={27} delay={0} />,
    ];

    const withFakeAsync = enhance(
      ({ state, setState, mounted }, { value, delay }) => {
        mounted(() => {
          setTimeout(() => {
            setState(value);
          }, delay);
        });

        return state;
      }
    );

    const Child = ({ value }) => value;
    const ChildWithFakeAsync = withFakeAsync("value", Child);

    actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    const expected = {
      type: Wrapper,
      props: {},
      children: [
        {
          type: expect.anything(), // enhancer
          key: undefined,
          props: { value: 18, delay },
          children: [
            {
              type: Child,
              props: { value: 18, delay },
              children: 18,
              key: undefined,
            },
          ],
        },
        {
          type: expect.anything(), // enhancer
          key: undefined,
          props: { value: 27, delay: 0 },
          children: [
            {
              type: Child,
              props: { value: 27, delay: 0 },
              children: 27,
              key: undefined,
            },
          ],
        },
      ],
      key: undefined,
    };

    expect(actual).toEqual(expected);
  });

  test("updates should not recompute sparks that have already been updated the same batch should update the same spark twice", () => {
    const Wrapper = () => [
      <ChildThatUpdates value={18} />,
      <ChildThatUpdates value={27} />,
    ];

    const updateTriggerer = enhance(
      ({ setState, state, mounted }, { value }) => {
        mounted(() => setState(value));
        return state;
      }
    );
    const Child = ({ value }) => <GrandChildThatUpdates value={value} />;
    const ChildThatUpdates = updateTriggerer(null, Child);

    const GrandChild = ({ value }) => value;
    const GrandChildThatUpdates = jest.fn(updateTriggerer("value", GrandChild));

    const actual = configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(GrandChildThatUpdates).toHaveBeenCalledTimes(4);
    expect(
      actual.children[0].children[0].children[0].children[0].children
    ).toBe(18);
    expect(
      actual.children[1].children[0].children[0].children[0].children
    ).toBe(27);
  });

  test("update propagation should stop if state did not change", () => {
    const withState = enhance(({ mounted, setState, state = 28 }) => {
      mounted(() => setState(28));
      return state;
    });
    const Wrapper = ({ value }) => <Child value={value} />;
    const WrapperWithValue = withState("value", Wrapper);

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const actual = configuredReconcile(<WrapperWithValue />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(1);
    expect(actual.children[0].children[0].children).toBe(28);
  });

  test("update propagation should stop if props did not change", () => {
    const withState = enhance(({ mounted, setState, state = 28 }) => {
      mounted(() => setState(29));
      return state;
    });
    const Wrapper = ({ value }) => <Child value={28} />;
    const WrapperWithValue = withState("value", Wrapper);

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const actual = configuredReconcile(<WrapperWithValue />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(1);
    expect(actual.children[0].children[0].children).toBe(28);
  });

  test("update propagation should not stop if props did change", () => {
    const withState = enhance(({ mounted, setState, state = 28 }) => {
      mounted(() => setState(29));
      return state;
    });
    const Wrapper = ({ value }) => <Child value={value} />;
    const WrapperWithValue = withState("value", Wrapper);

    const Child = jest.fn(({ value }) => {
      return value;
    });

    const actual = configuredReconcile(<WrapperWithValue />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children[0].children).toBe(29);
  });

  test("update propagation should not stop if prop count did change", () => {
    const withState = enhance(({ mounted, setState, state = 28 }) => {
      mounted(() => setState(29));
      return state;
    });
    const Wrapper = ({ value }) =>
      value === 28 ? (
        <Child value={28} />
      ) : (
        <Child value={28} valueFromState={value} />
      );
    const WrapperWithValue = withState("value", Wrapper);

    const Child = jest.fn(({ value, valueFromState }) => ({
      value,
      valueFromState,
      type: "UNKNOWN",
    }));

    const actual = configuredReconcile(<WrapperWithValue />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(Child).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children[0].children).toEqual([
      { type: "UNKNOWN", value: 28, valueFromState: 29, children: [] },
    ]);
  });

  test("reconcile should mount children added to a node after a setState update", () => {
    const mountedFn = jest.fn();
    const withMountedChecker = enhance(({ mounted }) => mounted(mountedFn));
    const withBoolean = enhance(({ mounted, setState, state = false }) => {
      mounted(() => setState(true));
      return state;
    });

    const Child = withMountedChecker(null, () => {});

    const Wrapper = ({ showChildThatMounts }) =>
      showChildThatMounts ? [<Child />, <Child />] : [<Child />];
    const WrapperWithBoolean = withBoolean("showChildThatMounts", Wrapper);

    const actual = configuredReconcile(<WrapperWithBoolean />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);
    expect(mountedFn).toHaveBeenCalledTimes(2);
    expect(actual.children[0].children.length).toBe(2);
  });

  test("reconcile should unmount children removed from a node after a setState update", () => {
    const unmountedFn = jest.fn();

    const withBoolean = enhance(({ mounted, setState, state = true }) => {
      mounted(() => setState(false));
      return state;
    });
    const withUnmountedChecker = enhance(({ unmounted }) =>
      unmounted(unmountedFn)
    );

    const Wrapper = ({ showChildThatUnmounts }) =>
      showChildThatUnmounts ? [<Child />, <ChildThatUnmounts />] : [<Child />];
    const WrapperWithBoolean = withBoolean("showChildThatUnmounts", Wrapper);

    const Child = () => {};
    const ChildThatUnmounts = withUnmountedChecker(null, Child);

    const actual = configuredReconcile(<WrapperWithBoolean />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(unmountedFn).toHaveBeenCalledTimes(1);
    expect(actual.children.length).toBe(1);
  });

  // eg: [ NodeA, NodeA, NodeA ] -> [ NodeA, NodeB, Node A ]
  // The second child should be : unmounted ( NodeA ), remounted ( NodeB )
  test("reconcile should unmount children that have changed type after a setState update", () => {
    const unmountedFn = jest.fn();

    const withUnmountedChecker = enhance(({ unmounted }) =>
      unmounted(unmountedFn)
    );
    const withBoolean = enhance(({ mounted, setState, state = true }) => {
      mounted(() => setState(false));
      return state;
    });

    const Wrapper = ({ showChildThatUnmounts }) =>
      showChildThatUnmounts
        ? [<Child />, <ChildThatUnmounts />, <Child />]
        : [<Child />, <Child />, <Child />];

    const Child = () => {};
    const ChildThatUnmounts = withUnmountedChecker(null, Child);

    const WrapperWithBoolean = withBoolean("showChildThatUnmounts", Wrapper);

    configuredReconcile(<WrapperWithBoolean />);

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

      return state;
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

    const WrapperWithCount = withCount("count", Wrapper);

    const withLifecycles = enhance(({ mounted, unmounted }) => {
      mounted(mountedFn);
      unmounted(unmountedFn);
    });

    const Child = () => {};
    const ChildThatShouldNotUnmount = withLifecycles(null, Child);

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

  test("children should render children props", () => {
    const Wrapper = (props) => <Child>{props.children}</Child>;
    const Child = ({ children }) => children;

    const actual = configuredReconcile(<Wrapper>b</Wrapper>);

    expect(actual.children[0].children[0]).toBe("b");
  });

  test("nodes should be able to declare themselves as dynamic, making them being re-rendered as often as possible", () => {
    jest.useFakeTimers();
    const makeDynamic = enhance(({ dynamic }) => dynamic(true));
    const DynamicNode = jest.fn(makeDynamic(null, () => {}));

    configuredReconcile(<DynamicNode />); // First render

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL); // Second render
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL); // Third render

    expect(DynamicNode).toHaveBeenCalledTimes(3);
  });

  test("nodes that are nested should not have their state reset when some parent triggers an update", () => {
    let mountedFn = null;

    const withValueKeeper = enhance(({ setState, state = null }) => {
      const setValue = (v) => setState(v);
      return { setValue, value: state };
    });
    const withState = enhance(({ mounted, setState, state = 1 }) => {
      if (!mountedFn) {
        mountedFn = jest.fn(() => setState(2));
      }
      mounted(mountedFn);
      return state;
    });

    const GrandFather = ({ valueKeeper }) => (
      <Father value={valueKeeper.value} onChanged={valueKeeper.setValue} />
    );
    const GrandFatherWithValueKeeper = withValueKeeper(
      "valueKeeper",
      GrandFather
    );

    const Father = (props) => {
      return <ChildWithValue value={props.value} onChanged={props.onChanged} />;
    };

    const Child = jest.fn(({ onChanged, value }) => {
      if (value === 2) {
        onChanged(value);
      }
      return value;
    });
    const ChildWithValue = withState("value", Child);

    const vtree = configuredReconcile(<GrandFatherWithValueKeeper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(Child).toHaveBeenCalledTimes(3);
    expect(mountedFn).toHaveBeenCalledTimes(1);
    expect(vtree.children[0].children[0].children[0].children[0].children).toBe(
      2
    );
  });

  test("enhance should provide node side-effect utilities to deal with lifecycles or state", () => {
    const withState = enhance(({ mounted, setState, state = null }) => {
      mounted(() => {
        setState(1);
      });

      return state;
    });

    const Node = (props) => props;
    const EnhancedNode = withState("actual", Node);

    const vtree = configuredReconcile(<EnhancedNode />); // First render

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL); // Second render

    expect(vtree.children[0].props).toEqual({ actual: 1 });
  });
});
