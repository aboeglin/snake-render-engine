export const Node = (fn) => {
  const constructor = (props) => {
    let state = {};
    const setState = (newState) => {
      state = newState;
    };

    const resolver = (internalFeatures) =>
      fn(props || {}, {
        ...internalFeatures,
        state,
        setState,
      });

    resolver.owner = constructor;
    resolver.context = {};
    return resolver;
  };

  return constructor;
};
