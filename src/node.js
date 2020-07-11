import { traverse } from "./core";

export const Node = (vnode) => {
  let isMounted = false;
  let unmountedFn = null;
  let state = null;
  let _vnode = vnode;

  // Later to do diff, initial oldProps = {} before first render.
  let oldProps;
  let props;

  const setState = (newState) => {
    state = newState;

    setTimeout(() => {
      traverse(
        {},
        _vnode,
        _vnode,
      );
    }, 200);
  };
  const getState = () => {
    return state;
  };

  const getType = () => type;

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

  const setVNode = (vnode) => {
    _vnode = vnode;
  };

  const getVNode = () => _vnode;

  return {
    setState,
    getState,
    getType,
    mounted,
    unmounted,
    triggerUnmounted,
    render: typeof vnode.type === "function" ? vnode.type : null,
    setVNode,
    getVNode,
  };
};
