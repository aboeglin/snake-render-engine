import { append, forEach, reject } from "ramda";

import { createElement } from "./create-element";

export const makeStore = (initialState = {}, subs = []) => {
  let state = initialState;
  let listeners = [];

  const dispatch = (action, payload) => {
    state = action(state, payload);
    forEach((f) => f(state))(listeners);
  };

  const listen = (cb) => {
    listeners = append(cb, listeners);
    return () => (listeners = reject((l) => l === cb, listeners));
  };

  const getState = () => state;

  forEach((s) => s(dispatch, getState))(subs);

  return {
    listen,
    dispatch,
    getState,
  };
};

export const withStore = (store) => (
  mapStateToProps = (state) => state,
  mapDispatchToProps = () => ({})
) => (Node) => {
  let unlisten = null;

  const enhancer = (
    props,
    { state = mapStateToProps(store.getState()), setState, mounted, unmounted }
  ) => {
    const handleStateChanged = (newState) => {
      setState(mapStateToProps(newState));
    };

    mounted(() => {
      unlisten = store.listen(handleStateChanged);
    });

    unmounted(() => unlisten && unlisten());

    const { children, ...rest } = props;

    return createElement(
      Node,
      { ...state, ...mapDispatchToProps(store.dispatch), ...rest },
      children
    );
  };

  Object.defineProperty(enhancer, "__ENHANCER__", {
    value: true,
    writable: false,
    configurable: false,
  });

  return enhancer;
};
