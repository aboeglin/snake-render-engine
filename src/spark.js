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
  let _dynamic = false;

  const setState = (newState) => {
    nextState = newState;

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

  const dynamic = (d) => {
    if (!_dynamic) {
      pushUpdate(_this);
    }
    _dynamic = d;
  };

  const isDynamic = () => _dynamic;

  const render = (vnode) => {
    _dirty = false;
    props = vnode.props;

    if (
      !_dynamic &&
      oldProps &&
      arePropsEqual(oldProps, props) &&
      state === nextState
    ) {
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
              dynamic,
            }
          )
        : vnode.children);
  };

  const isDirty = () => _dirty;
  const makeDirty = () => {
    _dirty = true;
  };

  return Object.assign(_this, {
    setState,
    mounted,
    unmounted,
    triggerUnmounted,
    render,
    getVNode,
    isDirty,
    makeDirty,
    isDynamic,
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
