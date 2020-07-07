export const Node = (fn) => {
  const constructor = (props) => {
    const resolver = (internalFeatures) =>
      fn(props || {}, {
        ...internalFeatures,
        // state: resolver.state,
        // setState: makeSetState(resolver),
      });

    // const makeSetState = (resolver) => (newState) => {
    //   resolver.state = newState;
    // };

    resolver.owner = constructor;
    resolver.context = {};
    return resolver;
  };

  return constructor;
};
