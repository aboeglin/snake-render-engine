import { always, curry, eqProps, ifElse, keys, pipe, reduce } from "ramda";

import { pushUpdate } from "./core";

export const Spark = (vnode) => {
  let _this = {};
  let isMounted = false;
  let unmountedFn = null;
  let state = undefined; // So that we can have default state in nodes.
  let nextState = undefined;
  let props = {};
  let oldProps = null;
  let _vnode = vnode;
  let _dirty = true;
  let _lastRender = null;

  const setState = (newState) => {
    nextState = newState;
    _dirty = true;

    pushUpdate(_this);
  };

  const mounted = (fn) => {
    if (!isMounted) {
      isMounted = true;
      fn();
    }
  };

  const unmounted = (fn) => {
    unmountedFn = fn;
  };

  const triggerUnmounted = () => {
    if (unmountedFn) {
      unmountedFn();
    }
  };

  const getVNode = () => _vnode;

  const render = (vnode) => {
    _dirty = false;
    props = vnode.props;

    if (oldProps && arePropsEqual(oldProps, props) && state === nextState) {
      return _lastRender;
    }

    state = nextState;
    oldProps = props;
    _vnode = vnode;

    return (_lastRender =
      typeof _vnode.type === "function"
        ? _vnode.type(
            { ..._vnode.props, children: _vnode.children },
            {
              state,
              setState,
              mounted,
              unmounted,
            }
          )
        : vnode.children);
  };

  const isDirty = () => _dirty;

  return Object.assign(_this, {
    setState,
    mounted,
    unmounted,
    triggerUnmounted,
    render,
    getVNode,
    isDirty,
  });
};

const arePropsEqual = curry((prevProps, nextProps) =>
  ifElse(
    (x) => keys(x).length === keys(nextProps).length,
    pipe(
      keys,
      reduce((r, key) => eqProps(key, prevProps, nextProps) && r, true)
    ),
    always(false)
  )(prevProps)
);
