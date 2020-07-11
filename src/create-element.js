export const createElement = (type, props = {}, children = []) => {
  const { key, ...realProps } = props;
  return VNode(type, realProps, children, key);
};

const VNode = (type, props, children, key) => ({
  type,
  props,
  children,
  key,
});
