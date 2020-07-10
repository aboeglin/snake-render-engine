export const Node = (type) => {
  let isMounted = false;
  let unmountedFn = null;
  let state = null;

  const setState = (newState) => {
    state = newState;
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

  const unmounted = fn => {
    unmountedFn = fn;
  }

  const triggerUnmounted = () => {
    if (unmountedFn) {
      unmountedFn();
    }
  }

  return {
    setState,
    getState,
    getType,
    mounted,
    unmounted,
    triggerUnmounted,
  };
};
