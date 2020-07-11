import { reconcile } from "./core";

export const Spark = vnode => {
  let _this = {};
  let isMounted = false;
  let unmountedFn = null;
  let state = null;
  let _vnode = vnode;

  // Later to do diff, initial oldProps = {} before first render.
  let oldProps;
  let props;

  const setState = newState => {
    state = newState;

    setTimeout(() => {
      reconcile({}, _vnode);
    }, 200);
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

  const unmounted = fn => {
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

  return Object.assign(_this, {
    setState,
    getState,
    mounted,
    unmounted,
    triggerUnmounted,
    render: typeof vnode.type === "function" ? vnode.type : null,
    setVNode,
    getVNode
  });
};
