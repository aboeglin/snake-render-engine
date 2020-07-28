import SRE, {
  initRenderer,
  initWithRenderer,
  Rect,
  withClock,
  reconcile,
  enhance,
} from "sre";
import { once, pipe, props } from "ramda";

const canvas = document.getElementById("canvas");
const height = canvas.height;
const width = canvas.width;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });




const MyNode = (props) => props.mountingText + props.valueFromState;

const sideEffects = enhance(
  ({ mounted, state = "not mounted", setState }, props) => {
    mounted(() => setState("mounted"));
    return { ...props, mountingText: state };
  }
);

const override = enhance(({ state, setState }, props) => {
  setState(props.value);
  return {...props, valueFromState: state};
});

const Enhanced = pipe(override, sideEffects)(MyNode);

const Wrapper = () => [
  <Enhanced value="1" />,
  <Enhanced value="2" />,
]

const tree = reconcile({}, <Wrapper />);

setTimeout(() => {
  console.log(tree);
}, 1000);
