import { makeStore, withStore } from "./store";
import { createElement } from "./create-element";
import { reconcile, enhance } from "./core";
import constants from "./constants";

/** @jsx createElement */

const configuredReconcile = reconcile({});

describe("store", () => {
  test("makeStore should return listen, dispatch and getState functions", () => {
    const store = makeStore();

    expect(typeof store.listen).toBe("function");
    expect(typeof store.dispatch).toBe("function");
    expect(typeof store.getState).toBe("function");
  });

  test("dispatched actions should update the state and call listeners with state update", done => {
    const store = makeStore();

    const Action = () => ({ modified: true });
    const listener = state => {
      expect(state.modified).toBe(true);
      done();
    };

    store.listen(listener);
    store.dispatch(Action);
  });

  test("getState return the current state", done => {
    const store = makeStore();

    expect(store.getState()).toEqual({});

    const Action = () => ({ modified: true });
    const listener = state => {
      expect(state.modified).toBe(true);
      expect(store.getState()).toBe(state);
      done();
    };

    store.listen(listener);
    store.dispatch(Action);
  });

  test("makeStore should take an initialState as first param", () => {
    const store = makeStore(1);
    expect(store.getState()).toEqual(1);
  });

  test("makeStore should take an array of subscriptions as a second param", done => {
    jest.useFakeTimers();

    const Action = () => ({ modified: true });
    const Subscription = dispatch => {
      setTimeout(() => dispatch(Action), 1000);
    };
    const store = makeStore({}, [Subscription]);

    const listener = state => {
      expect(state.modified).toBe(true);
      jest.resetAllMocks();
      done();
    };
    store.listen(listener);
    jest.advanceTimersByTime(1000);
  });

  test("listen should return a unlisten function", () => {
    const store = makeStore();

    const listener = jest.fn();
    const unlisten = store.listen(listener);
    unlisten();

    store.dispatch(x => x);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("withStore", () => {
  test("withStore should provide state to wrapped component", () => {
    const store = makeStore({ data: 1 });

    const Node = props => props;
    const NodeWithData = withStore(store)(state => state)(Node);

    const vtree = configuredReconcile(<NodeWithData />);

    expect(vtree.children[0].props).toEqual({ data: 1 });
  });

  test("withStore should provide the whole state if mapStateToProps is not given", () => {
    const store = makeStore({ data: 1 });

    const Node = props => props;
    const NodeWithData = withStore(store)()(Node);

    const vtree = configuredReconcile(<NodeWithData />);

    expect(vtree.children[0].props).toEqual({ data: 1 });
  });

  test("withStore should provide dispatch via mapDispatchToProps", () => {
    jest.useFakeTimers();

    const store = makeStore({ data: 1 });
    const Action = () => ({ data: 2 });
    const mapDispatchToProps = dispatch => ({
      onChange: () => dispatch(Action),
    });

    const Node = props => props;
    const NodeWithData = withStore(store)(x => x, mapDispatchToProps)(Node);

    const vtree = configuredReconcile(<NodeWithData />);

    expect(vtree.children[0].props).toEqual({
      data: 1,
      onChange: expect.any(Function),
    });

    vtree.children[0].props.onChange();
    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(vtree.children[0].props).toEqual({
      data: 2,
      onChange: expect.any(Function),
    });

    jest.resetAllMocks();
  });

  test("withStore should stop listening to the store when the node is unmounted", () => {
    jest.useFakeTimers();

    const store = makeStore({ data: 1 });
    const unlisten = jest.fn();
    store.listen = () => unlisten;

    let renderCount = 0;
    const renderTriggerer = enhance(({ mounted, setState, state }) => {
      mounted(() => setState(Math.random()));
      return state;
    })("random");
    const Wrapper = renderTriggerer(() => {
      renderCount = renderCount + 1;
      return renderCount === 1 ? <NodeWithData /> : null;
    });
    const Node = props => props;
    const NodeWithData = withStore(store)()(Node);

    configuredReconcile(<Wrapper />);

    jest.advanceTimersByTime(constants.BATCH_UPDATE_INTERVAL);

    expect(unlisten).toHaveBeenCalled();
    jest.resetAllMocks();
  });
});
