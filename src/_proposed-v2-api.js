
const NodeThatDoesSideEffects = incept(({ mounted, state = "not mounted", setState }, props) => {
  mounted(() => setState("mounted"));

  return { ...props, mountingText: state };
})(Node);

const Node = (props) => <Child>{props.mountingText}</Child>;

const Child = () => {};

const App = () => <NodeThatDoesSideEffects />;
