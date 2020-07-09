// export const createElement = (type, props = {}, children = []) => (features) =>
//   type({ ...props, children }, features);

export const createElement = (type, props = {}, children = []) => {
  return {
    type,
    props,
    children,
    _resolve: (features) => type({ ...props, children }, features),
  };
};
