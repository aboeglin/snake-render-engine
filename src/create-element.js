export const createElement = (type, props = {}, children = []) => {
  return {
    type,
    props,
    children,
  };
};
