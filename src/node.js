import { curry } from "ramda";
let count = 0;
// Add setState // state ( see _node.js )
export const Node = (fn) => {
  const constructor = (props) => {
    let state = {};
    const setState = (newState) => {
      state = newState;
    };

    const resolver = (internalFeatures) => {
      const resolved = fn(props || {}, {
        ...internalFeatures,
        state,
        setState,
      });
      // if (resolved) {
      //   resolved.__internal = resolver;
      // }
      return resolved;
    };

    resolver.context = {};

    return resolver;
  };

  return constructor;
};
