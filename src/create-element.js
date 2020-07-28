// Add tests for it
export const createElement = (type, props = {}, children = []) => {
  if (!props) {
    props = {};
  }

  const { key, ...realProps } = props;

  // if (type.prototype.constructor.length > 1 && !type.__INCEPT__) {
  //   throw "Illegal access: modes can only have a single props parameter";
  // }

  return VNode(type, realProps, children, key);
};

const VNode = (type, props, children, key) => ({
  type,
  props,
  children,
  key,
});
