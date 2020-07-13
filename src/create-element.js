export const createElement = (type, props = {}, children = []) => {
//   const { key, ...realProps } = props;
  const key = props.key;
  delete props.key;

  return VNode(type, props, children, key);
};

const VNode = (type, props, children, key) => ({
  type,
  props,
  children,
  key,
});
