import { pushUpdate } from "./core";

export const Spark = vnode => {
  let _this = {};
  let isMounted = false;
  let unmountedFn = null;
  let state = null;
  let props;
  let _vnode = vnode;
  let _dirty = true;

  // Later to do diff, initial oldProps = {} before first render.

  const setState = newState => {
    state = newState;
    _dirty = true

    pushUpdate(_this);
  };
  const getState = () => {
    return state;
  };

  const mounted = fn => {
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

  const setVNode = vnode => {
    _vnode = vnode;
  };

  const getVNode = () => _vnode;

  const render = (...inputs) => {
    _dirty = false;

    return typeof vnode.type === "function" ? vnode.type(...inputs) : null;
  }

  const isDirty = () => _dirty;

  return Object.assign(_this, {
    setState,
    getState,
    mounted,
    unmounted,
    triggerUnmounted,
    render,
    setVNode,
    getVNode,
    isDirty,
  });
};
